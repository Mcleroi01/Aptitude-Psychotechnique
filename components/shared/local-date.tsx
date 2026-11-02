"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Date affichée dans le fuseau du navigateur (le serveur tourne en UTC).
 * Rendu vide côté serveur pour éviter un écart d'hydratation.
 */
export function LocalDate({ value, withTime = true }: { value: Date | string | null; withTime?: boolean }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!value) return <>—</>;
  const date = new Date(value);
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {mounted
        ? date.toLocaleString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            ...(withTime && { hour: "2-digit", minute: "2-digit" }),
          })
        : ""}
    </time>
  );
}

/** Valeur d'un <input type="datetime-local"> dans le fuseau du navigateur. */
export function toDateTimeLocal(value: Date | string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Saisie datetime-local (heure locale) → ISO 8601 avec fuseau, ou null. */
export function fromDateTimeLocal(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
