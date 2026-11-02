/** Agrégation des scores d'une tentative : fonctions pures. */

export type ScoredAnswer = {
  points: number;
  /** Note finale : manuelle si elle existe, automatique sinon ; null si en attente */
  score: number | null;
  needsManualReview: boolean;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function finalScore(answer: { autoScore: number | null; manualScore: number | null }): number | null {
  return answer.manualScore ?? answer.autoScore;
}

/**
 * Score d'un ensemble de réponses. Le total ne descend pas sous zéro, même
 * avec des points négatifs ; une réponse en attente compte zéro provisoirement.
 */
export function summarize(answers: ScoredAnswer[]) {
  const maxScore = round(answers.reduce((sum, a) => sum + a.points, 0));
  const raw = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
  const score = round(Math.max(0, raw));
  return {
    score,
    maxScore,
    percent: maxScore > 0 ? round((score / maxScore) * 100) : 0,
    pendingReview: answers.some((a) => a.needsManualReview && a.score === null),
  };
}

/** Réussite : chaque seuil défini (global et par épreuve) doit être atteint. */
export function hasPassed(
  global: { percent: number; passingPercent: number | null },
  sections: { percent: number; passingPercent: number | null }[],
): boolean | null {
  const thresholds = [global, ...sections].filter((s) => s.passingPercent !== null);
  if (thresholds.length === 0) return null;
  return thresholds.every((s) => s.percent >= (s.passingPercent as number));
}
