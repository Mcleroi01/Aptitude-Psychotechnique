import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { AttemptEndReason, Difficulty } from "@/generated/prisma/enums";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { parseDrawRules } from "@/lib/assessments/validation";
import { finalScore, hasPassed, summarize } from "@/lib/attempts/scoring";
import { attemptDeadline, effectiveDeadline, elapsedSeconds, isPast, SAVE_GRACE_MS, sectionDeadline } from "@/lib/attempts/timing";
import { responseSchemas } from "@/lib/questions/answer-key";
import { buildCorrection, type Correction } from "@/lib/questions/correction";
import { gradeResponse } from "@/lib/questions/grading";
import { drawSectionQuestions, shuffle } from "@/services/assessment.service";
import { ownerWhere, type AttemptOwner } from "@/lib/attempt-owner";

/**
 * Moteur de tentative. Toutes les décisions liées au temps sont prises ici,
 * avec l'horloge du serveur ; les tentatives dépassées sont clôturées à la
 * première lecture (et par la tâche planifiée), sans dépendre du navigateur.
 */

const attemptInclude = {
  campaign: {
    select: { id: true, title: true, status: true, closesAt: true, resultsVisibility: true, organizationId: true },
  },
  assessment: {
    select: { id: true, title: true, instructions: true, timingMode: true, durationSeconds: true, passingPercent: true },
  },
  category: { select: { name: true } },
  sections: {
    orderBy: { order: "asc" },
    include: {
      section: { select: { instructions: true, navigationMode: true, allowReview: true, durationSeconds: true, passingPercent: true } },
      _count: { select: { answers: true } },
    },
  },
} satisfies Prisma.AssessmentAttemptInclude;

export type LoadedAttempt = Prisma.AssessmentAttemptGetPayload<{ include: typeof attemptInclude }>;

const gradingSelect = {
  id: true,
  response: true,
  points: true,
  negativePoints: true,
  autoScore: true,
  manualScore: true,
  isCorrect: true,
  needsManualReview: true,
  question: {
    select: {
      type: true,
      answerKey: true,
      requiresManualGrading: true,
      options: { select: { label: true, isCorrect: true } },
    },
  },
} satisfies Prisma.AttemptAnswerSelect;

// ─── Démarrage ───────────────────────────────────────────────────────────────

type Pick = { questionId: string; points: number; negativePoints: number };

async function createAttempt(data: {
  owner: AttemptOwner;
  mode: "PRACTICE" | "CAMPAIGN";
  assessmentId?: string;
  campaignId?: string;
  invitationId?: string;
  categoryId?: string | null;
  difficulty?: Difficulty | null;
  deadlineAt: Date | null;
  sections: { sectionId: string | null; title: string; picks: Pick[]; startNow: boolean; deadlineAt: Date | null }[];
}) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.assessmentAttempt.create({
      data: {
        ...ownerWhere(data.owner),
        mode: data.mode,
        assessmentId: data.assessmentId,
        campaignId: data.campaignId,
        invitationId: data.invitationId,
        categoryId: data.categoryId ?? null,
        difficulty: data.difficulty ?? null,
        startedAt: now,
        deadlineAt: data.deadlineAt,
      },
      select: { id: true },
    });
    let firstSectionId: string | null = null;
    for (const [order, section] of data.sections.entries()) {
      const created = await tx.attemptSection.create({
        data: {
          attemptId: attempt.id,
          sectionId: section.sectionId,
          order,
          title: section.title,
          status: section.startNow ? "IN_PROGRESS" : "NOT_STARTED",
          startedAt: section.startNow ? now : null,
          deadlineAt: section.deadlineAt,
        },
        select: { id: true },
      });
      firstSectionId ??= created.id;
      await tx.attemptAnswer.createMany({
        data: section.picks.map((pick, position) => ({
          attemptId: attempt.id,
          attemptSectionId: created.id,
          questionId: pick.questionId,
          position,
          points: pick.points,
          negativePoints: pick.negativePoints,
        })),
      });
    }
    await tx.assessmentAttempt.update({ where: { id: attempt.id }, data: { currentSectionId: firstSectionId } });
    return attempt;
  });
}

/** Questions de chaque épreuve, tirées au démarrage : l'ordre et le barème sont alors figés. */
async function buildSections(assessmentId: string, organizationId: string | null) {
  const sections = await prisma.assessmentSection.findMany({
    where: { assessmentId },
    orderBy: { order: "asc" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        where: { question: { status: "PUBLISHED", isLatest: true } },
        select: { questionId: true, points: true, negativePoints: true },
      },
    },
  });
  const built = [];
  for (const section of sections) {
    const picks: Pick[] =
      section.selectionMode === "FIXED"
        ? section.questions
        : (await drawSectionQuestions({ organizationId }, parseDrawRules(section.drawRules))).map((p) => ({ ...p, negativePoints: 0 }));
    if (picks.length === 0) {
      throw new AppError("CONFLICT", "Cette évaluation ne contient plus de questions disponibles. Prévenez l'organisateur.");
    }
    built.push({ sectionId: section.id, title: section.title, picks: section.shuffleQuestions ? shuffle(picks) : picks });
  }
  if (built.length === 0) throw new AppError("CONFLICT", "Cette évaluation ne contient aucune épreuve.");
  return built;
}

async function startFromAssessment(
  owner: AttemptOwner,
  assessment: { id: string; organizationId: string | null; timingMode: string; durationSeconds: number | null },
  campaign: { id: string; closesAt: Date | null } | null,
  invitationId?: string,
) {
  const sections = await buildSections(assessment.id, assessment.organizationId);
  const deadlineAt = attemptDeadline(
    new Date(),
    assessment.timingMode === "GLOBAL" ? assessment.durationSeconds : null,
    campaign?.closesAt ?? null,
  );
  return createAttempt({
    owner,
    mode: "CAMPAIGN",
    assessmentId: assessment.id,
    campaignId: campaign?.id,
    invitationId,
    deadlineAt,
    // Chaque épreuve démarre sur action du candidat, après lecture des consignes.
    sections: sections.map((s) => ({ ...s, startNow: false, deadlineAt: null })),
  });
}

/** Examen blanc de la plateforme : tentatives illimitées, une seule en cours à la fois. */
export async function startPlatformExam(owner: AttemptOwner, assessmentId: string) {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, organizationId: null, status: "PUBLISHED" },
    select: { id: true, organizationId: true, timingMode: true, durationSeconds: true },
  });
  if (!assessment) throw new AppError("NOT_FOUND", "Examen introuvable.");
  const ongoing = await prisma.assessmentAttempt.findFirst({
    where: { ...ownerWhere(owner), assessmentId, campaignId: null, status: "IN_PROGRESS" },
    select: { id: true },
  });
  return ongoing ?? startFromAssessment(owner, assessment, null);
}

/** Campagne : vérifie période, accès, statut de l'organisation et nombre de tentatives. */
export async function startCampaignAttempt(user: { id: string; email: string }, campaignId: string, publicToken?: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      organization: { select: { status: true } },
      assessment: { select: { id: true, organizationId: true, timingMode: true, durationSeconds: true } },
    },
  });
  const now = new Date();
  if (!campaign || campaign.status !== "PUBLISHED" || campaign.organization.status !== "ACTIVE") {
    throw new AppError("NOT_FOUND", "Cette campagne n'est pas ouverte.");
  }
  if (campaign.opensAt && campaign.opensAt > now) throw new AppError("FORBIDDEN", "Cette campagne n'est pas encore ouverte.");
  if (campaign.closesAt && campaign.closesAt <= now) throw new AppError("FORBIDDEN", "Cette campagne est clôturée.");

  let invitationId: string | undefined;
  if (campaign.accessMode === "LINK") {
    if (!publicToken || publicToken !== campaign.publicToken) throw new AppError("FORBIDDEN", "Lien de participation invalide.");
  } else {
    const invitation = await prisma.invitation.findFirst({
      where: { campaignId, email: user.email, status: { in: ["PENDING", "SENT", "ACCEPTED"] } },
      select: { id: true },
    });
    if (!invitation) throw new AppError("FORBIDDEN", "Cette campagne est réservée aux candidats invités.");
    invitationId = invitation.id;
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: now, userId: user.id },
    });
  }

  const ongoing = await prisma.assessmentAttempt.findFirst({
    where: { userId: user.id, campaignId, status: "IN_PROGRESS" },
    select: { id: true },
  });
  if (ongoing) return ongoing;

  const used = await prisma.assessmentAttempt.count({ where: { userId: user.id, campaignId } });
  if (used >= campaign.maxAttempts) {
    throw new AppError("FORBIDDEN", "Vous avez utilisé toutes les tentatives autorisées pour cette campagne.");
  }
  return startFromAssessment({ userId: user.id }, campaign.assessment, campaign, invitationId);
}

/** Entraînement libre sur la banque Aptitude, avec correction question par question. */
export async function startPractice(
  owner: AttemptOwner,
  options: { categoryId: string | null; difficulty: Difficulty | null; count: number },
) {
  const category = options.categoryId
    ? await prisma.category.findFirst({ where: { id: options.categoryId, organizationId: null }, select: { id: true, name: true } })
    : null;
  if (options.categoryId && !category) throw new AppError("VALIDATION", "Catégorie invalide.");

  const candidates = await prisma.question.findMany({
    where: {
      organizationId: null,
      status: "PUBLISHED",
      isLatest: true,
      // Une réponse à corriger par un humain ne convient pas à l'entraînement autonome.
      requiresManualGrading: false,
      ...(category && { categoryId: category.id }),
      ...(options.difficulty && { difficulty: options.difficulty }),
    },
    select: { id: true, defaultPoints: true },
  });
  if (candidates.length === 0) throw new AppError("NOT_FOUND", "Aucune question ne correspond à ces critères pour le moment.");

  const picks = shuffle(candidates)
    .slice(0, options.count)
    .map((q) => ({ questionId: q.id, points: q.defaultPoints, negativePoints: 0 }));
  return createAttempt({
    owner,
    mode: "PRACTICE",
    categoryId: category?.id,
    difficulty: options.difficulty,
    deadlineAt: null,
    sections: [{ sectionId: null, title: category ? `Entraînement · ${category.name}` : "Entraînement", picks, startNow: true, deadlineAt: null }],
  });
}

// ─── Lecture et clôture paresseuse ───────────────────────────────────────────

async function loadAttempt(attemptId: string, owner?: AttemptOwner) {
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, ...(owner && ownerWhere(owner)) },
    include: attemptInclude,
  });
  if (!attempt) throw new AppError("NOT_FOUND", "Tentative introuvable.");
  return attempt;
}

const currentSection = (attempt: LoadedAttempt) => attempt.sections.find((s) => s.id === attempt.currentSectionId) ?? null;

/** Échéance en vigueur pour la tentative (épreuve en cours, globale, clôture). */
export function currentDeadline(attempt: LoadedAttempt): Date | null {
  const section = currentSection(attempt);
  return effectiveDeadline({
    attemptDeadlineAt: attempt.deadlineAt,
    sectionDeadlineAt: section?.status === "IN_PROGRESS" ? section.deadlineAt : null,
    campaignClosesAt: attempt.campaign?.closesAt ?? null,
  });
}

/**
 * Applique les échéances dépassées : clôture l'épreuve (ou la tentative)
 * dont le temps est écoulé. Idempotent et sûr en cas d'appels simultanés.
 */
export async function getAttemptState(attemptId: string, owner?: AttemptOwner): Promise<LoadedAttempt> {
  let attempt = await loadAttempt(attemptId, owner);
  for (let guard = 0; guard < attempt.sections.length + 1 && attempt.status === "IN_PROGRESS"; guard++) {
    const now = new Date();
    const campaign = attempt.campaign;
    const campaignOver = campaign && (campaign.status !== "PUBLISHED" || isPast(campaign.closesAt, now));
    if (campaignOver) {
      await finalizeAttempt(attempt.id, "CAMPAIGN_CLOSED", now);
    } else if (isPast(attempt.deadlineAt, now)) {
      await finalizeAttempt(attempt.id, "TIME_EXPIRED", now);
    } else {
      const section = currentSection(attempt);
      if (!(section?.status === "IN_PROGRESS" && isPast(section.deadlineAt, now))) break;
      await completeSection(attempt.id, section.id, now);
    }
    attempt = await loadAttempt(attemptId, owner);
  }
  return attempt;
}

/** Note les réponses d'une épreuve et la marque terminée. Renvoie false si déjà fait. */
async function gradeSection(sectionAttemptId: string, now: Date): Promise<boolean> {
  const section = await prisma.attemptSection.findUnique({
    where: { id: sectionAttemptId },
    select: { id: true, status: true, startedAt: true, deadlineAt: true },
  });
  if (!section || section.status === "COMPLETED") return false;
  const claimed = await prisma.attemptSection.updateMany({
    where: { id: section.id, status: { not: "COMPLETED" } },
    data: { status: "COMPLETED", completedAt: now },
  });
  if (claimed.count === 0) return false;

  const answers = await prisma.attemptAnswer.findMany({ where: { attemptSectionId: section.id }, select: gradingSelect });
  const graded = answers.map((answer) => {
    // Réponse déjà notée (vérifiée en entraînement) : on conserve la note.
    if (answer.autoScore !== null || answer.manualScore !== null) return { answer, update: null };
    const grade = gradeResponse(answer.question, answer.response, { points: answer.points, negativePoints: answer.negativePoints });
    return {
      answer,
      update: { isCorrect: grade.isCorrect, autoScore: grade.score, needsManualReview: grade.status === "pending_review" },
    };
  });
  await prisma.$transaction(
    graded.filter((g) => g.update).map((g) => prisma.attemptAnswer.update({ where: { id: g.answer.id }, data: g.update! })),
  );

  const summary = summarize(
    graded.map(({ answer, update }) => ({
      points: answer.points,
      score: update ? update.autoScore : finalScore(answer),
      needsManualReview: update ? update.needsManualReview : answer.needsManualReview,
    })),
  );
  await prisma.attemptSection.update({
    where: { id: section.id },
    data: {
      score: summary.score,
      maxScore: summary.maxScore,
      timeSpentSeconds: section.startedAt ? elapsedSeconds(section.startedAt, now, section.deadlineAt) : 0,
    },
  });
  return true;
}

/** Termine l'épreuve en cours et passe à la suivante, ou clôt la tentative. */
async function completeSection(attemptId: string, sectionAttemptId: string, now: Date) {
  await gradeSection(sectionAttemptId, now);
  const next = await prisma.attemptSection.findFirst({
    where: { attemptId, status: "NOT_STARTED" },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  if (next) {
    await prisma.assessmentAttempt.updateMany({
      where: { id: attemptId, currentSectionId: sectionAttemptId },
      data: { currentSectionId: next.id },
    });
  } else {
    await finalizeAttempt(attemptId, "SUBMITTED", now);
  }
}

/** Clôture définitive : note les épreuves restantes et calcule les résultats. */
async function finalizeAttempt(attemptId: string, reason: AttemptEndReason, now: Date) {
  // Réservation atomique : un seul appel finalise, même en cas de concurrence.
  const claimed = await prisma.assessmentAttempt.updateMany({
    where: { id: attemptId, status: "IN_PROGRESS", endReason: null },
    data: { endReason: reason, submittedAt: now },
  });
  if (claimed.count === 0) return;

  const attempt = await prisma.assessmentAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: {
      startedAt: true,
      deadlineAt: true,
      assessment: { select: { passingPercent: true } },
      sections: { select: { id: true, status: true } },
    },
  });
  for (const section of attempt.sections) {
    if (section.status !== "COMPLETED") await gradeSection(section.id, now);
  }
  await recomputeAttemptScore(attemptId, { timeSpentSeconds: elapsedSeconds(attempt.startedAt, now, attempt.deadlineAt) });
}

/** Recalcule scores et réussite (après soumission ou après une notation manuelle). */
export async function recomputeAttemptScore(attemptId: string, extra: { timeSpentSeconds?: number } = {}) {
  const attempt = await prisma.assessmentAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: {
      assessment: { select: { passingPercent: true } },
      sections: {
        select: {
          id: true,
          section: { select: { passingPercent: true } },
          answers: { select: { points: true, autoScore: true, manualScore: true, needsManualReview: true } },
        },
      },
    },
  });
  const toScored = (a: { points: number; autoScore: number | null; manualScore: number | null; needsManualReview: boolean }) => ({
    points: a.points,
    score: finalScore(a),
    needsManualReview: a.needsManualReview,
  });
  const sectionSummaries = attempt.sections.map((s) => ({
    id: s.id,
    passingPercent: s.section?.passingPercent ?? null,
    ...summarize(s.answers.map(toScored)),
  }));
  const total = summarize(attempt.sections.flatMap((s) => s.answers.map(toScored)));
  const passed = total.pendingReview
    ? null
    : hasPassed({ percent: total.percent, passingPercent: attempt.assessment?.passingPercent ?? null }, sectionSummaries);

  await prisma.$transaction([
    ...sectionSummaries.map((s) => prisma.attemptSection.update({ where: { id: s.id }, data: { score: s.score, maxScore: s.maxScore } })),
    prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: total.score,
        maxScore: total.maxScore,
        passed,
        status: total.pendingReview ? "PENDING_REVIEW" : "COMPLETED",
        ...(extra.timeSpentSeconds !== undefined && { timeSpentSeconds: extra.timeSpentSeconds }),
      },
    }),
  ]);
}

// ─── Actions du candidat ─────────────────────────────────────────────────────

function assertInProgress(attempt: LoadedAttempt) {
  if (attempt.status !== "IN_PROGRESS" || attempt.endReason) {
    throw new AppError("CONFLICT", "Cette tentative est terminée.");
  }
}

export async function startCurrentSection(attemptId: string, owner: AttemptOwner) {
  const attempt = await getAttemptState(attemptId, owner);
  assertInProgress(attempt);
  const section = currentSection(attempt);
  if (!section || section.status !== "NOT_STARTED") return;
  const now = new Date();
  const perSection = attempt.assessment?.timingMode === "PER_SECTION" ? (section.section?.durationSeconds ?? null) : null;
  const bound = effectiveDeadline({ attemptDeadlineAt: attempt.deadlineAt, sectionDeadlineAt: null, campaignClosesAt: attempt.campaign?.closesAt ?? null });
  await prisma.attemptSection.updateMany({
    where: { id: section.id, status: "NOT_STARTED" },
    data: { status: "IN_PROGRESS", startedAt: now, deadlineAt: sectionDeadline(now, perSection, bound) },
  });
}

export async function saveAnswer(
  attemptId: string,
  owner: AttemptOwner,
  input: { answerId: string; response: unknown; flagged: boolean; timeSpentMs: number },
) {
  const attempt = await getAttemptState(attemptId, owner);
  assertInProgress(attempt);
  const section = currentSection(attempt);
  if (!section || section.status !== "IN_PROGRESS") throw new AppError("CONFLICT", "Aucune épreuve en cours.");
  if (isPast(currentDeadline(attempt), new Date(), SAVE_GRACE_MS)) {
    throw new AppError("CONFLICT", "Le temps imparti est écoulé : la réponse n'a pas été enregistrée.");
  }

  const answer = await prisma.attemptAnswer.findFirst({
    where: { id: input.answerId, attemptId, attemptSectionId: section.id },
    select: { id: true, position: true, isCorrect: true, autoScore: true, question: { select: { type: true } } },
  });
  if (!answer) throw new AppError("NOT_FOUND", "Question introuvable dans l'épreuve en cours.");
  if (attempt.mode === "PRACTICE" && answer.autoScore !== null) {
    throw new AppError("CONFLICT", "Cette réponse a déjà été vérifiée.");
  }
  if (section.section?.navigationMode === "FORWARD_ONLY") {
    const passed = await prisma.attemptAnswer.count({
      where: {
        attemptSectionId: section.id,
        position: { gt: answer.position },
        OR: [{ answeredAt: { not: null } }, { timeSpentMs: { gt: 0 } }],
      },
    });
    if (passed > 0) throw new AppError("CONFLICT", "Le retour sur une question précédente n'est pas autorisé dans cette épreuve.");
  }

  const response = input.response == null ? null : responseSchemas[answer.question.type].parse(input.response);
  await prisma.attemptAnswer.update({
    where: { id: answer.id },
    data: {
      response: response ?? Prisma.DbNull,
      answeredAt: response ? new Date() : null,
      flagged: input.flagged,
      // Plafond par envoi : un horodatage client aberrant ne fausse pas les statistiques.
      timeSpentMs: { increment: Math.min(Math.max(0, Math.round(input.timeSpentMs)), 15 * 60_000) },
    },
  });
}

export async function submitCurrentSection(attemptId: string, owner: AttemptOwner) {
  const attempt = await getAttemptState(attemptId, owner);
  if (attempt.status !== "IN_PROGRESS") return;
  const section = currentSection(attempt);
  if (!section || section.status !== "IN_PROGRESS") throw new AppError("CONFLICT", "Aucune épreuve en cours.");
  await completeSection(attempt.id, section.id, new Date());
}

/** Entraînement : corrige immédiatement une question et renvoie la correction. */
export async function checkPracticeAnswer(attemptId: string, owner: AttemptOwner, answerId: string): Promise<Correction> {
  const attempt = await getAttemptState(attemptId, owner);
  assertInProgress(attempt);
  if (attempt.mode !== "PRACTICE") throw new AppError("FORBIDDEN", "La correction immédiate n'existe qu'en entraînement.");

  const answer = await prisma.attemptAnswer.findFirst({
    where: { id: answerId, attemptId },
    select: {
      ...gradingSelect,
      question: { select: { ...gradingSelect.question.select, explanation: true, classicMethod: true, quickMethod: true, tip: true, commonMistakes: true } },
    },
  });
  if (!answer) throw new AppError("NOT_FOUND", "Question introuvable.");
  if (answer.response == null) throw new AppError("VALIDATION", "Répondez avant de vérifier.");

  const grade =
    answer.autoScore !== null
      ? { status: answer.isCorrect ? ("correct" as const) : answer.autoScore > 0 ? ("partial" as const) : ("incorrect" as const), score: answer.autoScore, isCorrect: answer.isCorrect }
      : gradeResponse(answer.question, answer.response, { points: answer.points, negativePoints: answer.negativePoints });
  if (answer.autoScore === null) {
    await prisma.attemptAnswer.update({
      where: { id: answer.id },
      data: { isCorrect: grade.isCorrect, autoScore: grade.score, needsManualReview: grade.status === "pending_review" },
    });
  }
  return buildCorrection(answer.question, grade);
}

// ─── Tâche planifiée ─────────────────────────────────────────────────────────

/** Clôture les tentatives abandonnées dont l'échéance est passée. */
export async function expireOverdueAttempts(limit = 200): Promise<number> {
  const now = new Date();
  const overdue = await prisma.assessmentAttempt.findMany({
    where: {
      status: "IN_PROGRESS",
      OR: [
        { deadlineAt: { lt: now } },
        { sections: { some: { status: "IN_PROGRESS", deadlineAt: { lt: now } } } },
        { campaign: { OR: [{ status: { not: "PUBLISHED" } }, { closesAt: { lt: now } }] } },
      ],
    },
    take: limit,
    select: { id: true },
  });
  for (const { id } of overdue) await getAttemptState(id);
  return overdue.length;
}

// ─── Visiteurs sans compte ───────────────────────────────────────────────────

/** Rattache au compte les tentatives faites sans compte depuis ce navigateur. */
export async function claimGuestAttempts(guestId: string, userId: string): Promise<number> {
  const { count } = await prisma.assessmentAttempt.updateMany({
    where: { guestId, userId: null },
    data: { userId, guestId: null },
  });
  return count;
}

/** Supprime les tentatives sans compte, jamais rattachées, de plus de 30 jours. */
export async function purgeStaleGuestAttempts(): Promise<number> {
  const { count } = await prisma.assessmentAttempt.deleteMany({
    where: { userId: null, startedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  });
  return count;
}
