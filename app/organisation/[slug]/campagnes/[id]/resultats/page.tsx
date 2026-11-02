import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalDate } from "@/components/shared/local-date";
import { PercentBars, ScoreDistribution } from "@/features/results/components/charts";
import { formatDuration, formatPoints } from "@/lib/assessments/labels";
import { AppError } from "@/lib/errors";
import { requireOrgMember } from "@/lib/guards";
import { getCampaignResults } from "@/services/results.service";

export const metadata: Metadata = { title: "Résultats de la campagne" };

const statusLabels = { IN_PROGRESS: "En cours", PENDING_REVIEW: "En correction", COMPLETED: "Terminée" } as const;
const fmt = (n: number | null) => (n === null ? "—" : `${String(n).replace(".", ",")} %`);

export default async function CampaignResultsPage({ params }: PageProps<"/organisation/[slug]/campagnes/[id]/resultats">) {
  const { slug, id } = await params;
  const { organization } = await requireOrgMember(slug, "results:read");

  let data: Awaited<ReturnType<typeof getCampaignResults>>;
  try {
    data = await getCampaignResults(organization.id, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const { campaign, attempts, stats } = data;
  const base = `/organisation/${organization.slug}/campagnes/${campaign.id}`;

  const tiles = [
    { label: "Participants", value: String(stats.participants) },
    { label: "Tentatives terminées", value: String(stats.finished), hint: stats.inProgress ? `${stats.inProgress} en cours` : undefined },
    { label: "Score moyen", value: fmt(stats.average), hint: stats.median !== null ? `médiane ${fmt(stats.median)}` : undefined },
    { label: "Taux de réussite", value: fmt(stats.passRate), hint: campaign.assessment.passingPercent === null ? "selon les seuils des épreuves" : `seuil ${campaign.assessment.passingPercent} %` },
  ];

  return (
    <>
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {campaign.title}
      </Link>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Résultats</h1>
          <p className="mt-1 text-sm text-muted-foreground">{campaign.assessment.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={`${base}/resultats/export?format=csv`}>
              <Download data-icon="inline-start" /> Export CSV
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`${base}/resultats/export?format=pdf`}>
              <FileText data-icon="inline-start" /> Rapport PDF
            </a>
          </Button>
        </div>
      </div>

      {stats.pendingReview > 0 && (
        <p className="mt-6 rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          {stats.pendingReview} tentative(s) attendent une correction manuelle : leurs scores sont provisoires.{" "}
          <Link href={`/organisation/${organization.slug}/correction?campagne=${campaign.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
            Corriger
          </Link>
        </p>
      )}

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular">{tile.value}</dd>
            {tile.hint && <dd className="text-xs text-muted-foreground">{tile.hint}</dd>}
          </div>
        ))}
      </dl>

      {stats.finished > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold">Répartition des scores</h2>
            <ScoreDistribution buckets={stats.distribution} />
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold">Score moyen par épreuve</h2>
            <PercentBars
              rows={stats.sections.map((s) => ({
                key: s.id,
                label: s.title,
                percent: s.average,
                detail: s.averageTime !== null ? formatDuration(s.averageTime) : undefined,
              }))}
            />
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold">Réussite par catégorie</h2>
            <PercentBars
              rows={stats.categories.map((c) => ({ key: c.name, label: c.name, percent: c.percent, detail: `${c.correct}/${c.total}` }))}
            />
          </section>
        </div>
      )}

      <section className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <h2 className="border-b px-5 py-3 font-heading text-base font-semibold">Tentatives</h2>
        {attempts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Aucune tentative pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Candidat</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Réussite</th>
                <th className="px-5 py-3 text-right font-medium">Temps</th>
                <th className="px-5 py-3 font-medium">Soumise le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3">
                    <Link href={`${base}/resultats/${a.id}`} className="font-medium hover:underline">
                      {a.user.name}
                    </Link>
                    <span className="block text-muted-foreground">{a.user.email}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={a.status === "COMPLETED" ? "success" : "secondary"}>{statusLabels[a.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap tabular">
                    {a.percent === null ? "—" : (
                      <>
                        <span className="font-medium">{fmt(a.percent)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatPoints(a.score ?? 0)} / {formatPoints(a.maxScore ?? 0)}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-5 py-3">{a.passed === null ? "—" : a.passed ? "Oui" : "Non"}</td>
                  <td className="px-5 py-3 text-right tabular">{formatDuration(a.timeSpentSeconds)}</td>
                  <td className="px-5 py-3 whitespace-nowrap tabular">
                    <LocalDate value={a.submittedAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
