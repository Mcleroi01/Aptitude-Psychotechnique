import "server-only";
import { prisma } from "@/lib/prisma";
import { finalScore } from "@/lib/attempts/scoring";
import { resultAccess } from "@/lib/attempts/visibility";
import { mean, percentOf } from "@/lib/results/stats";

/**
 * Tableau de bord du candidat. Seules comptent les tentatives dont il a le
 * droit de voir le score : une campagne aux résultats masqués n'y apparaît pas.
 */
export async function getCandidateDashboard(userId: string) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, status: { not: "IN_PROGRESS" } },
    orderBy: { submittedAt: "asc" },
    take: 200,
    select: {
      id: true,
      mode: true,
      submittedAt: true,
      score: true,
      maxScore: true,
      campaign: { select: { title: true, resultsVisibility: true, status: true, closesAt: true } },
      assessment: { select: { title: true } },
      category: { select: { name: true } },
    },
  });
  const visible = attempts.filter((a) => !a.campaign || resultAccess(a.campaign) !== "none");
  const series = visible.map((a) => ({
    id: a.id,
    percent: percentOf(a.score ?? 0, a.maxScore ?? 0),
    date: a.submittedAt,
    label: a.campaign?.title ?? a.assessment?.title ?? (a.category ? `Entraînement · ${a.category.name}` : "Entraînement"),
  }));

  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId: { in: visible.map((a) => a.id) } },
    select: { isCorrect: true, points: true, autoScore: true, manualScore: true, question: { select: { category: { select: { name: true } } } } },
  });
  const byCategory = new Map<string, { name: string; correct: number; total: number; score: number; maxScore: number }>();
  for (const a of answers) {
    const name = a.question.category?.name ?? "Sans catégorie";
    const entry = byCategory.get(name) ?? { name, correct: 0, total: 0, score: 0, maxScore: 0 };
    entry.total++;
    entry.maxScore += a.points;
    entry.score += finalScore(a) ?? 0;
    if (a.isCorrect) entry.correct++;
    byCategory.set(name, entry);
  }
  const categories = [...byCategory.values()]
    .map((c) => ({ ...c, percent: percentOf(c.score, c.maxScore) }))
    .sort((a, b) => a.percent - b.percent);

  return {
    totalAttempts: visible.length,
    answered: answers.length,
    average: mean(series.map((s) => s.percent)),
    best: series.length ? Math.max(...series.map((s) => s.percent)) : null,
    recent: series.slice(-12),
    categories,
    /** Catégories à retravailler : au moins 3 réponses et moins de 60 % de réussite */
    weakest: categories.filter((c) => c.total >= 3 && c.percent < 60).slice(0, 3),
  };
}
