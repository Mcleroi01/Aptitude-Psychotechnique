import "server-only";
import type { AttemptEndReason, AttemptMode, AttemptStatus, NavigationMode, SectionAttemptStatus, TimingMode } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { finalScore } from "@/lib/attempts/scoring";
import { resultAccess, type ResultAccess } from "@/lib/attempts/visibility";
import type { QuestionResponse } from "@/lib/questions/answer-key";
import { buildCorrection, storedGradeStatus, type Correction } from "@/lib/questions/correction";
import { toCandidateQuestion, type CandidateQuestion } from "@/lib/questions/public";
import { currentDeadline, getAttemptState, type LoadedAttempt } from "@/services/attempt.service";
import { signedReadUrl } from "@/services/storage.service";
import type { AttemptOwner } from "@/lib/attempt-owner";

/**
 * Données envoyées au navigateur. Règle absolue : aucune clé de correction,
 * sauf la correction d'une question vérifiée en entraînement.
 */
export type AttemptView = {
  id: string;
  mode: AttemptMode;
  title: string;
  instructions: string | null;
  status: AttemptStatus;
  endReason: AttemptEndReason | null;
  timingMode: TimingMode;
  serverNow: string;
  deadline: string | null;
  sections: {
    id: string;
    title: string;
    status: SectionAttemptStatus;
    questionCount: number;
    durationSeconds: number | null;
    instructions: string | null;
    navigationMode: NavigationMode;
    allowReview: boolean;
  }[];
  currentSectionId: string | null;
  /** Questions de l'épreuve en cours, uniquement une fois l'épreuve démarrée */
  items: {
    answerId: string;
    position: number;
    points: number;
    flagged: boolean;
    response: QuestionResponse | null;
    question: CandidateQuestion;
    correction: Correction | null;
  }[];
};

async function media(q: { imagePath: string | null; attachmentPath: string | null; attachmentName: string | null }) {
  const [imageUrl, attachmentUrl] = await Promise.all([signedReadUrl("image", q.imagePath), signedReadUrl("attachment", q.attachmentPath)]);
  return { imageUrl, attachment: attachmentUrl ? { name: q.attachmentName ?? "Document", url: attachmentUrl } : null };
}

const questionSelect = {
  id: true,
  type: true,
  prompt: true,
  answerKey: true,
  imagePath: true,
  attachmentPath: true,
  attachmentName: true,
  options: { select: { label: true, text: true, order: true, isCorrect: true } },
  explanation: true,
  classicMethod: true,
  quickMethod: true,
  tip: true,
  commonMistakes: true,
  category: { select: { name: true } },
} as const;

function attemptTitle(attempt: LoadedAttempt) {
  return attempt.campaign?.title ?? attempt.assessment?.title ?? attempt.sections[0]?.title ?? "Entraînement";
}

export async function getAttemptView(attemptId: string, owner: AttemptOwner): Promise<AttemptView> {
  const attempt = await getAttemptState(attemptId, owner);
  const current = attempt.sections.find((s) => s.id === attempt.currentSectionId) ?? null;
  const showItems = attempt.status === "IN_PROGRESS" && current?.status === "IN_PROGRESS";

  const answers = showItems
    ? await prisma.attemptAnswer.findMany({
        where: { attemptSectionId: current.id },
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          points: true,
          flagged: true,
          response: true,
          isCorrect: true,
          autoScore: true,
          manualScore: true,
          needsManualReview: true,
          question: { select: questionSelect },
        },
      })
    : [];

  return {
    id: attempt.id,
    mode: attempt.mode,
    title: attemptTitle(attempt),
    instructions: attempt.assessment?.instructions ?? null,
    status: attempt.status,
    endReason: attempt.endReason,
    timingMode: attempt.assessment?.timingMode ?? "NONE",
    serverNow: new Date().toISOString(),
    deadline: currentDeadline(attempt)?.toISOString() ?? null,
    currentSectionId: attempt.currentSectionId,
    sections: attempt.sections.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      questionCount: s._count.answers,
      durationSeconds: attempt.assessment?.timingMode === "PER_SECTION" ? (s.section?.durationSeconds ?? null) : null,
      instructions: s.section?.instructions ?? null,
      navigationMode: s.section?.navigationMode ?? "FREE",
      allowReview: s.section?.allowReview ?? true,
    })),
    items: await Promise.all(
      answers.map(async (a) => {
        const checked = attempt.mode === "PRACTICE" && a.autoScore !== null;
        return {
          answerId: a.id,
          position: a.position,
          points: a.points,
          flagged: a.flagged,
          response: (a.response as QuestionResponse | null) ?? null,
          question: toCandidateQuestion(a.question, await media(a.question)),
          correction: checked
            ? buildCorrection(a.question, {
                status: storedGradeStatus({ ...a, score: finalScore(a) }),
                score: finalScore(a),
              })
            : null,
        };
      }),
    ),
  };
}

// ─── Résultats ───────────────────────────────────────────────────────────────

export type AttemptResult = Awaited<ReturnType<typeof getAttemptResult>>;

/** Résultats vus par le candidat, selon la visibilité choisie par l'organisation. */
export async function getAttemptResult(attemptId: string, owner: AttemptOwner) {
  const attempt = await getAttemptState(attemptId, owner);
  return buildResult(attempt, resultAccess(attempt.campaign));
}

/** Résultats complets d'une tentative, pour une tentative déjà chargée et autorisée. */
export async function buildFullResult(attempt: LoadedAttempt) {
  return buildResult(attempt, "full");
}

async function buildResult(attempt: LoadedAttempt, access: ResultAccess) {
  const attemptId = attempt.id;
  const base = {
    id: attempt.id,
    mode: attempt.mode,
    title: attemptTitle(attempt),
    status: attempt.status,
    endReason: attempt.endReason,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    timeSpentSeconds: attempt.timeSpentSeconds,
    campaignId: attempt.campaignId,
    assessmentId: attempt.assessmentId,
    access,
    /** Tentative faite sans compte : le candidat peut la conserver en créant un compte */
    guest: attempt.userId === null,
  };
  if (attempt.status === "IN_PROGRESS" || access === "none") return { ...base, summary: null, sections: [], categories: [], items: [] };

  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId },
    orderBy: [{ section: { order: "asc" } }, { position: "asc" }],
    select: {
      id: true,
      attemptSectionId: true,
      position: true,
      points: true,
      response: true,
      isCorrect: true,
      autoScore: true,
      manualScore: true,
      needsManualReview: true,
      feedback: true,
      timeSpentMs: true,
      question: { select: questionSelect },
    },
  });

  const categories = new Map<string, { name: string; correct: number; total: number; score: number; maxScore: number }>();
  for (const a of answers) {
    const name = a.question.category?.name ?? "Sans catégorie";
    const entry = categories.get(name) ?? { name, correct: 0, total: 0, score: 0, maxScore: 0 };
    entry.total++;
    entry.maxScore += a.points;
    entry.score += finalScore(a) ?? 0;
    if (a.isCorrect) entry.correct++;
    categories.set(name, entry);
  }

  const items =
    access === "full"
      ? await Promise.all(
          answers.map(async (a) => {
            const score = finalScore(a);
            return {
              answerId: a.id,
              sectionId: a.attemptSectionId,
              position: a.position,
              points: a.points,
              timeSpentMs: a.timeSpentMs,
              feedback: a.feedback,
              needsManualReview: a.needsManualReview,
              manualScore: a.manualScore,
              autoScore: a.autoScore,
              response: (a.response as QuestionResponse | null) ?? null,
              question: toCandidateQuestion(a.question, await media(a.question)),
              correction: buildCorrection(a.question, { status: storedGradeStatus({ ...a, score }), score }),
            };
          }),
        )
      : [];

  return {
    ...base,
    summary: {
      score: attempt.score ?? 0,
      maxScore: attempt.maxScore ?? 0,
      percent: attempt.maxScore ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 1000) / 10 : 0,
      passed: attempt.passed,
      passingPercent: attempt.assessment?.passingPercent ?? null,
      answered: answers.filter((a) => a.response != null).length,
      correct: answers.filter((a) => a.isCorrect).length,
      total: answers.length,
    },
    sections: attempt.sections.map((s) => ({
      id: s.id,
      title: s.title,
      score: s.score ?? 0,
      maxScore: s.maxScore ?? 0,
      timeSpentSeconds: s.timeSpentSeconds,
      passingPercent: s.section?.passingPercent ?? null,
    })),
    categories: [...categories.values()].map((c) => ({
      ...c,
      score: Math.round(c.score * 100) / 100,
      maxScore: Math.round(c.maxScore * 100) / 100,
    })),
    items,
  };
}

// ─── Listes ──────────────────────────────────────────────────────────────────

export async function listUserAttempts(userId: string, take = 10) {
  return prisma.assessmentAttempt.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take,
    select: {
      id: true,
      mode: true,
      status: true,
      startedAt: true,
      score: true,
      maxScore: true,
      campaign: { select: { title: true, resultsVisibility: true, status: true, closesAt: true } },
      assessment: { select: { title: true } },
      category: { select: { name: true } },
    },
  });
}

export async function listPlatformExams() {
  return prisma.assessment.findMany({
    where: { organizationId: null, status: "PUBLISHED" },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      timingMode: true,
      durationSeconds: true,
      sections: { select: { durationSeconds: true, selectionMode: true, drawRules: true, _count: { select: { questions: true } } } },
    },
  });
}

/** Campagne retrouvée par son lien public, avec les informations utiles au candidat. */
export async function getCampaignByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return null;
  return prisma.campaign.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      accessMode: true,
      opensAt: true,
      closesAt: true,
      maxAttempts: true,
      resultsVisibility: true,
      organization: { select: { name: true, status: true } },
      assessment: {
        select: {
          title: true,
          instructions: true,
          timingMode: true,
          durationSeconds: true,
          sections: { orderBy: { order: "asc" }, select: { title: true, durationSeconds: true } },
        },
      },
    },
  });
}

export async function userCampaignAttempts(userId: string, campaignId: string) {
  return prisma.assessmentAttempt.findMany({
    where: { userId, campaignId },
    orderBy: { startedAt: "desc" },
    select: { id: true, status: true, startedAt: true },
  });
}
