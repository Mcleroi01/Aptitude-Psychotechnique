import { CircleCheck, CircleX, Clock, Hourglass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocalDate } from "@/components/shared/local-date";
import { CorrectionPanel, gradeLabels } from "@/features/attempts/components/correction-panel";
import { ReadOnlyQuestion } from "@/features/attempts/components/read-only-question";
import { formatDuration, formatPoints } from "@/lib/assessments/labels";
import type { AttemptResult } from "@/services/attempt-view.service";

const endReasonText = {
  SUBMITTED: "Soumise par le candidat",
  TIME_EXPIRED: "Soumise automatiquement à la fin du temps",
  CAMPAIGN_CLOSED: "Soumise automatiquement à la clôture de la campagne",
} as const;

const pct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 1000) / 10 : 0);

type ResultItem = AttemptResult["items"][number];

/** Composant serveur : `renderItemExtra` ajoute un bloc sous chaque question (notation côté organisation). */
export function AttemptResultView({
  result,
  renderItemExtra,
}: {
  result: AttemptResult;
  renderItemExtra?: (item: ResultItem) => React.ReactNode;
}) {
  const { summary } = result;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Résultats</p>
        <h1 className="mt-1 text-3xl font-semibold">{result.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <LocalDate value={result.submittedAt ?? result.startedAt} />
          {result.endReason && ` · ${endReasonText[result.endReason]}`}
        </p>
      </div>

      {result.access === "none" || !summary ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="flex items-center gap-2 font-medium">
            <CircleCheck className="size-5 text-success" aria-hidden /> Votre participation est enregistrée.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            L&apos;organisation a choisi de ne pas communiquer les résultats sur la plateforme.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 sm:col-span-1">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="mt-1 text-3xl font-semibold tabular">{String(summary.percent).replace(".", ",")} %</p>
              <p className="text-sm text-muted-foreground tabular">
                {formatPoints(summary.score)} sur {formatPoints(summary.maxScore)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">Réponses justes</p>
              <p className="mt-1 text-3xl font-semibold tabular">
                {summary.correct}
                <span className="text-lg text-muted-foreground"> / {summary.total}</span>
              </p>
              <p className="text-sm text-muted-foreground tabular">{summary.total - summary.answered} sans réponse</p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">Temps utilisé</p>
              <p className="mt-1 flex items-center gap-2 text-3xl font-semibold tabular">
                <Clock className="size-5 text-muted-foreground" aria-hidden />
                {formatDuration(result.timeSpentSeconds)}
              </p>
            </div>
          </section>

          {result.status === "PENDING_REVIEW" && (
            <p className="flex gap-2.5 rounded-lg border bg-muted/50 px-4 py-3 text-sm">
              <Hourglass className="mt-0.5 size-4 shrink-0" aria-hidden />
              Certaines réponses attendent la notation d&apos;un correcteur : le score est provisoire.
            </p>
          )}
          {summary.passed !== null && (
            <p className="flex items-center gap-2 font-medium">
              {summary.passed ? (
                <CircleCheck className="size-5 text-success" aria-hidden />
              ) : (
                <CircleX className="size-5 text-destructive" aria-hidden />
              )}
              {summary.passed ? "Seuils de réussite atteints" : "Seuils de réussite non atteints"}
            </p>
          )}

          {result.sections.length > 1 && (
            <ResultTable
              title="Par épreuve"
              rows={result.sections.map((s) => ({
                key: s.id,
                label: s.title,
                detail: s.timeSpentSeconds !== null ? formatDuration(s.timeSpentSeconds) : "",
                score: s.score,
                max: s.maxScore,
                threshold: s.passingPercent,
              }))}
            />
          )}
          <ResultTable
            title="Par catégorie"
            rows={result.categories.map((c) => ({
              key: c.name,
              label: c.name,
              detail: `${c.correct} / ${c.total} juste(s)`,
              score: c.score,
              max: c.maxScore,
              threshold: null,
            }))}
          />

          {result.access === "score" && (
            <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              La correction détaillée n&apos;est pas communiquée
              {result.campaignId ? " pour le moment, conformément aux règles de la campagne." : "."}
            </p>
          )}

          {result.items.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-heading text-lg font-semibold">Correction détaillée</h2>
              {result.items.map((item, i) => (
                <article key={item.answerId} className="space-y-4 rounded-xl border bg-card p-5">
                  <header className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium tabular">Question {i + 1}</span>
                    <span className="flex items-center gap-2">
                      {item.timeSpentMs > 0 && <span className="text-muted-foreground tabular">{formatDuration(Math.round(item.timeSpentMs / 1000))}</span>}
                      <Badge variant={gradeLabels[item.correction.status].variant}>{gradeLabels[item.correction.status].text}</Badge>
                    </span>
                  </header>
                  <ReadOnlyQuestion question={item.question} response={item.response} correctLabels={item.correction.correctLabels} />
                  <CorrectionPanel correction={item.correction} points={item.points} feedback={item.feedback} />
                  {renderItemExtra?.(item)}
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ResultTable({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; detail: string; score: number; max: number; threshold: number | null }[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded-xl border bg-card">
      <h2 className="border-b px-5 py-3 font-heading text-base font-semibold">{title}</h2>
      <ul className="divide-y">
        {rows.map((row) => {
          const percent = pct(row.score, row.max);
          return (
            <li key={row.key} className="px-5 py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground tabular">
                  {row.detail && `${row.detail} · `}
                  {formatPoints(row.score)} / {formatPoints(row.max)}
                </span>
              </div>
              <div className="relative mt-2 h-2 rounded-full bg-muted" role="img" aria-label={`${percent} %`}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} />
                {row.threshold !== null && (
                  <span className="absolute -top-1 h-4 w-0.5 bg-foreground" style={{ left: `${row.threshold}%` }} title={`Seuil ${row.threshold} %`} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
