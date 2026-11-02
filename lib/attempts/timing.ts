/**
 * Règles de chronométrage, pures et testées. Le serveur est la seule horloge
 * qui fait foi : le navigateur ne fait qu'afficher un compte à rebours.
 */

/** Tolérance accordée à une réponse envoyée juste avant zéro (latence réseau). */
export const SAVE_GRACE_MS = 3_000;

const earliest = (dates: (Date | null | undefined)[]): Date | null =>
  dates.reduce<Date | null>((min, d) => (d && (!min || d < min) ? d : min), null);

/** Échéance globale fixée au démarrage : durée globale éventuelle, bornée par la clôture. */
export function attemptDeadline(start: Date, globalDurationSeconds: number | null, campaignClosesAt: Date | null): Date | null {
  const byDuration = globalDurationSeconds ? new Date(start.getTime() + globalDurationSeconds * 1000) : null;
  return earliest([byDuration, campaignClosesAt]);
}

/** Échéance d'une épreuve qui démarre maintenant, bornée par l'échéance globale. */
export function sectionDeadline(start: Date, sectionDurationSeconds: number | null, attemptDeadlineAt: Date | null): Date | null {
  const byDuration = sectionDurationSeconds ? new Date(start.getTime() + sectionDurationSeconds * 1000) : null;
  return earliest([byDuration, attemptDeadlineAt]);
}

/** Échéance qui s'applique à l'instant : la plus proche entre épreuve, tentative et clôture. */
export function effectiveDeadline(parts: {
  attemptDeadlineAt: Date | null;
  sectionDeadlineAt: Date | null;
  campaignClosesAt: Date | null;
}): Date | null {
  return earliest([parts.attemptDeadlineAt, parts.sectionDeadlineAt, parts.campaignClosesAt]);
}

export function isPast(deadline: Date | null, now: Date, graceMs = 0): boolean {
  return deadline !== null && now.getTime() > deadline.getTime() + graceMs;
}

/** Secondes écoulées, bornées à l'échéance (le temps « utilisé » ne dépasse jamais la limite). */
export function elapsedSeconds(start: Date, end: Date, deadline: Date | null): number {
  const stop = deadline && deadline < end ? deadline : end;
  return Math.max(0, Math.round((stop.getTime() - start.getTime()) / 1000));
}
