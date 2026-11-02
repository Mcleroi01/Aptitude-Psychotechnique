import { cn } from "@/lib/utils";

/**
 * Graphiques sobres à une seule série (couleur primaire), sans bibliothèque :
 * barres fines à extrémité arrondie, info-bulle au survol, et tableau
 * équivalent pour les lecteurs d'écran.
 */

const fmt = (n: number) => String(n).replace(".", ",");

/** Histogramme de la répartition des scores par tranches de 10 %. */
export function ScoreDistribution({ buckets }: { buckets: number[] }) {
  const max = Math.max(1, ...buckets);
  const labels = buckets.map((_, i) => (i === 9 ? "90–100 %" : `${i * 10}–${i * 10 + 9} %`));
  return (
    <figure>
      <div className="flex h-40 items-end gap-[2px] border-b" aria-hidden>
        {buckets.map((count, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80"
              style={{ height: `${(count / max) * 100}%`, minHeight: count ? 2 : 0 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-sm group-hover:block">
              {labels[i]} : <strong className="tabular">{count}</strong>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground tabular" aria-hidden>
        <span>0 %</span>
        <span>50 %</span>
        <span>100 %</span>
      </div>
      <table className="sr-only">
        <caption>Répartition des scores</caption>
        <thead>
          <tr>
            <th>Tranche</th>
            <th>Tentatives</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((count, i) => (
            <tr key={i}>
              <td>{labels[i]}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Liste de pourcentages en barres horizontales, valeur écrite en clair. */
export function PercentBars({
  rows,
  className,
}: {
  rows: { key: string; label: string; percent: number | null; detail?: string }[];
  className?: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Pas encore de données.</p>;
  return (
    <ul className={cn("space-y-3.5", className)}>
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 text-muted-foreground tabular">
              {row.detail && `${row.detail} · `}
              <span className="font-medium text-foreground">{row.percent === null ? "—" : `${fmt(row.percent)} %`}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted" title={row.percent === null ? undefined : `${fmt(row.percent)} %`}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, row.percent ?? 0)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
