import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { finalScore } from "@/lib/attempts/scoring";
import { describeExpected } from "@/lib/questions/correction";
import { toCandidateQuestion } from "@/lib/questions/public";
import { distribution, mean, median, passRate, percentOf } from "@/lib/results/stats";
import { getAttemptState, recomputeAttemptScore } from "@/services/attempt.service";
import { buildFullResult } from "@/services/attempt-view.service";

/**
 * Résultats et notation côté organisation. Toute requête est restreinte aux
 * campagnes de l'organisation : une organisation ne voit jamais d'autres tentatives.
 */

// ─── Résultats d'une campagne ────────────────────────────────────────────────

export async function getCampaignResults(organizationId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId },
    select: {
      id: true,
      title: true,
      status: true,
      closesAt: true,
      assessment: { select: { title: true, passingPercent: true, sections: { orderBy: { order: "asc" }, select: { id: true, title: true } } } },
    },
  });
  if (!campaign) throw new AppError("NOT_FOUND", "Campagne introuvable.");

  // Les tentatives en cours ou abandonnées sont clôturées si leur échéance est passée.
  const open = await prisma.assessmentAttempt.findMany({ where: { campaignId, status: "IN_PROGRESS" }, select: { id: true } });
  for (const { id } of open) await getAttemptState(id);

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { campaignId },
    orderBy: [{ score: { sort: "desc", nulls: "last" } }, { startedAt: "asc" }],
    select: {
      id: true,
      status: true,
      endReason: true,
      startedAt: true,
      submittedAt: true,
      timeSpentSeconds: true,
      score: true,
      maxScore: true,
      passed: true,
      user: { select: { name: true, email: true } },
      sections: { orderBy: { order: "asc" }, select: { sectionId: true, title: true, score: true, maxScore: true, timeSpentSeconds: true } },
    },
  });

  const finished = attempts.filter((a) => a.status !== "IN_PROGRESS");
  const percents = finished.map((a) => percentOf(a.score ?? 0, a.maxScore ?? 0));

  // Moyennes par épreuve (rapprochées par épreuve d'origine, l'ordre pouvant être identique).
  const sectionStats = campaign.assessment.sections.map((section) => {
    const values = finished.flatMap((a) =>
      a.sections.filter((s) => s.sectionId === section.id).map((s) => percentOf(s.score ?? 0, s.maxScore ?? 0)),
    );
    const times = finished.flatMap((a) => a.sections.filter((s) => s.sectionId === section.id && s.timeSpentSeconds !== null).map((s) => s.timeSpentSeconds!));
    return { id: section.id, title: section.title, average: mean(values), averageTime: times.length ? Math.round(times.reduce((x, y) => x + y, 0) / times.length) : null };
  });

  // Taux de réussite par catégorie, sur toutes les réponses des tentatives terminées.
  const categoryRows = await prisma.attemptAnswer.findMany({
    where: { attempt: { campaignId, status: { not: "IN_PROGRESS" } } },
    select: { isCorrect: true, points: true, autoScore: true, manualScore: true, question: { select: { category: { select: { name: true } } } } },
  });
  const categories = new Map<string, { name: string; correct: number; total: number; score: number; maxScore: number }>();
  for (const row of categoryRows) {
    const name = row.question.category?.name ?? "Sans catégorie";
    const entry = categories.get(name) ?? { name, correct: 0, total: 0, score: 0, maxScore: 0 };
    entry.total++;
    entry.maxScore += row.points;
    entry.score += finalScore(row) ?? 0;
    if (row.isCorrect) entry.correct++;
    categories.set(name, entry);
  }

  return {
    campaign,
    attempts: attempts.map((a) => ({ ...a, percent: a.status === "IN_PROGRESS" ? null : percentOf(a.score ?? 0, a.maxScore ?? 0) })),
    stats: {
      participants: new Set(attempts.map((a) => a.user.email)).size,
      finished: finished.length,
      inProgress: attempts.length - finished.length,
      pendingReview: attempts.filter((a) => a.status === "PENDING_REVIEW").length,
      average: mean(percents),
      median: median(percents),
      passRate: passRate(finished.map((a) => a.passed)),
      distribution: distribution(percents),
      sections: sectionStats,
      categories: [...categories.values()].map((c) => ({ ...c, percent: percentOf(c.score, c.maxScore) })),
    },
  };
}

export type CampaignResults = Awaited<ReturnType<typeof getCampaignResults>>;

/** Tentative d'une campagne de l'organisation, avec correction complète et identité du candidat. */
export async function getAttemptForOrganization(organizationId: string, attemptId: string) {
  const owner = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, campaign: { organizationId } },
    select: { user: { select: { name: true, email: true } } },
  });
  if (!owner) throw new AppError("NOT_FOUND", "Tentative introuvable.");
  const attempt = await getAttemptState(attemptId);
  return { candidate: owner.user, result: await buildFullResult(attempt) };
}

// ─── Notation manuelle ───────────────────────────────────────────────────────

const reviewWhere = (organizationId: string, campaignId?: string): Prisma.AttemptAnswerWhereInput => ({
  needsManualReview: true,
  attempt: { status: { not: "IN_PROGRESS" }, campaign: { organizationId, ...(campaignId && { id: campaignId }) } },
});

/**
 * Réponses à noter. Les correcteurs voient un identifiant de copie, pas le nom
 * du candidat : la notation reste anonyme.
 */
export async function listReviewQueue(
  organizationId: string,
  options: { campaignId?: string; state: "pending" | "graded"; take?: number },
) {
  const answers = await prisma.attemptAnswer.findMany({
    where: { ...reviewWhere(organizationId, options.campaignId), manualScore: options.state === "pending" ? null : { not: null } },
    orderBy: options.state === "pending" ? { attempt: { submittedAt: "asc" } } : { gradedAt: "desc" },
    take: options.take ?? 30,
    select: {
      id: true,
      attemptId: true,
      points: true,
      response: true,
      manualScore: true,
      feedback: true,
      gradedAt: true,
      gradedBy: { select: { name: true } },
      attempt: { select: { campaign: { select: { id: true, title: true } } } },
      question: { select: { id: true, type: true, prompt: true, answerKey: true, options: { select: { label: true, text: true, order: true } } } },
    },
  });
  const counts = await prisma.attemptAnswer.groupBy({
    by: ["attemptId"],
    where: { ...reviewWhere(organizationId), manualScore: null },
  });
  return {
    pendingAttempts: counts.length,
    items: answers.map((a) => ({
      id: a.id,
      copyCode: a.attemptId.slice(-6).toUpperCase(),
      campaign: a.attempt.campaign!,
      points: a.points,
      response: a.response,
      manualScore: a.manualScore,
      feedback: a.feedback,
      gradedAt: a.gradedAt,
      gradedBy: a.gradedBy?.name ?? null,
      question: toCandidateQuestion(a.question),
      /** Réponses acceptées saisies par l'auteur : une aide pour le correcteur */
      hint: describeExpected(a.question.type, a.question.answerKey),
    })),
  };
}

export async function listReviewCampaigns(organizationId: string) {
  return prisma.campaign.findMany({
    where: { organizationId, attempts: { some: { answers: { some: { needsManualReview: true } } } } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
}

/**
 * Note (ou ajuste) une réponse. Valable pour une réponse en attente comme pour
 * une réponse déjà notée automatiquement : la note manuelle prime toujours.
 */
export async function gradeAnswer(
  organizationId: string,
  graderId: string,
  answerId: string,
  input: { score: number; feedback: string },
) {
  const answer = await prisma.attemptAnswer.findFirst({
    where: { id: answerId, attempt: { campaign: { organizationId } } },
    select: { id: true, points: true, attemptId: true, attempt: { select: { status: true } } },
  });
  if (!answer) throw new AppError("NOT_FOUND", "Réponse introuvable.");
  if (answer.attempt.status === "IN_PROGRESS") throw new AppError("CONFLICT", "La tentative est encore en cours.");
  if (input.score > answer.points) {
    throw new AppError("VALIDATION", `La note ne peut pas dépasser ${answer.points} point(s).`, { score: ["Note trop élevée"] });
  }

  await prisma.attemptAnswer.update({
    where: { id: answer.id },
    data: {
      manualScore: input.score,
      isCorrect: input.score >= answer.points,
      feedback: input.feedback || null,
      gradedById: graderId,
      gradedAt: new Date(),
    },
  });
  await recomputeAttemptScore(answer.attemptId);
}
