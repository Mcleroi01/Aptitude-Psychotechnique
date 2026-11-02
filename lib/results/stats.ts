/** Statistiques descriptives d'une série de pourcentages : fonctions pures. */

const round1 = (n: number) => Math.round(n * 10) / 10;

export function mean(values: number[]): number | null {
  return values.length ? round1(values.reduce((s, v) => s + v, 0) / values.length) : null;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return round1(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
}

/** Taux de réussite parmi les tentatives dont la réussite est déterminée. */
export function passRate(passed: (boolean | null)[]): number | null {
  const decided = passed.filter((p): p is boolean => p !== null);
  return decided.length ? round1((decided.filter(Boolean).length / decided.length) * 100) : null;
}

/** Répartition par tranches de 10 points de pourcentage (0–9, 10–19, … 90–100). */
export function distribution(percents: number[]): number[] {
  const buckets = Array.from({ length: 10 }, () => 0);
  for (const p of percents) buckets[Math.min(9, Math.max(0, Math.floor(p / 10)))]++;
  return buckets;
}

export const percentOf = (score: number, max: number) => (max > 0 ? round1((score / max) * 100) : 0);
