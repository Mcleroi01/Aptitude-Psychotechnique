import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { LocalDate } from "@/components/shared/local-date";
import { ReadOnlyQuestion } from "@/features/attempts/components/read-only-question";
import { GradeForm } from "@/features/results/components/grade-form";
import { formatPoints } from "@/lib/assessments/labels";
import { requireOrgMember } from "@/lib/guards";
import type { QuestionResponse } from "@/lib/questions/answer-key";
import { cn } from "@/lib/utils";
import { listReviewCampaigns, listReviewQueue } from "@/services/results.service";

export const metadata: Metadata = { title: "Correction" };

export default async function CorrectionPage({ params, searchParams }: PageProps<"/organisation/[slug]/correction">) {
  const { slug } = await params;
  const query = await searchParams;
  const { organization } = await requireOrgMember(slug, "answers:grade");
  const state = query.etat === "corrigees" ? "graded" : "pending";
  const campaignId = typeof query.campagne === "string" && query.campagne.length <= 40 ? query.campagne || undefined : undefined;

  const [queue, campaigns] = await Promise.all([
    listReviewQueue(organization.id, { campaignId, state }),
    listReviewCampaigns(organization.id),
  ]);
  const base = `/organisation/${organization.slug}/correction`;
  const href = (etat: string) => `${base}?etat=${etat}${campaignId ? `&campagne=${campaignId}` : ""}`;

  return (
    <>
      <h1 className="text-3xl font-semibold">Correction</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Réponses qui demandent une notation humaine. Les copies sont anonymes : seul un code les identifie. Chaque note
        recalcule aussitôt le score de la tentative.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" className="inline-flex rounded-lg bg-muted p-1 text-sm">
          {(
            [
              ["a-corriger", "À corriger", state === "pending"],
              ["corrigees", "Déjà corrigées", state === "graded"],
            ] as const
          ).map(([value, label, active]) => (
            <Link
              key={value}
              role="tab"
              aria-selected={active}
              href={href(value)}
              className={cn("rounded-md px-3 py-1.5 font-medium", active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </Link>
          ))}
        </div>
        {campaigns.length > 0 && (
          <form method="get" className="flex gap-2">
            <input type="hidden" name="etat" value={state === "graded" ? "corrigees" : "a-corriger"} />
            <NativeSelect name="campagne" defaultValue={campaignId ?? ""} aria-label="Campagne" className="w-56">
              <option value="">Toutes les campagnes</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </NativeSelect>
            <Button type="submit" variant="outline">
              Filtrer
            </Button>
          </form>
        )}
      </div>

      {state === "pending" && (
        <p className="mt-4 text-sm text-muted-foreground tabular">{queue.pendingAttempts} copie(s) en attente de correction.</p>
      )}

      {queue.items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="font-medium">{state === "pending" ? "Aucune réponse à corriger." : "Aucune réponse corrigée pour le moment."}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {queue.items.map((item) => (
            <li key={item.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    Copie {item.copyCode}
                  </Badge>
                  <span className="text-muted-foreground">{item.campaign.title}</span>
                </span>
                <span className="text-muted-foreground tabular">{formatPoints(item.points)}</span>
              </div>
              <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-3">
                  <ReadOnlyQuestion question={item.question} response={item.response as QuestionResponse | null} />
                  {item.hint && (
                    <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                      <span className="font-medium">Réponses indicatives : </span>
                      {item.hint}
                    </p>
                  )}
                </div>
                <div>
                  {item.gradedAt && (
                    <p className="mb-3 text-xs text-muted-foreground">
                      Notée {item.gradedBy && `par ${item.gradedBy} `}le <LocalDate value={item.gradedAt} />
                    </p>
                  )}
                  <GradeForm
                    slug={organization.slug}
                    answerId={item.id}
                    points={item.points}
                    initialScore={item.manualScore}
                    initialFeedback={item.feedback}
                    submitLabel={item.manualScore === null ? "Enregistrer la note" : "Modifier la note"}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
