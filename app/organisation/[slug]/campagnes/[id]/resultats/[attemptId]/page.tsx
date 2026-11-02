import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttemptResultView } from "@/features/attempts/components/attempt-result-view";
import { GradeForm } from "@/features/results/components/grade-form";
import { AppError } from "@/lib/errors";
import { requireOrgMember } from "@/lib/guards";
import { can } from "@/lib/permissions";
import { getAttemptForOrganization } from "@/services/results.service";

export const metadata: Metadata = { title: "Tentative" };

export default async function OrgAttemptPage({ params }: PageProps<"/organisation/[slug]/campagnes/[id]/resultats/[attemptId]">) {
  const { slug, id, attemptId } = await params;
  const { organization, role } = await requireOrgMember(slug, "results:read");

  let data: Awaited<ReturnType<typeof getAttemptForOrganization>>;
  try {
    data = await getAttemptForOrganization(organization.id, attemptId);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  if (data.result.campaignId !== id) notFound();
  const base = `/organisation/${organization.slug}/campagnes/${id}/resultats`;
  const canGrade = can(role, "answers:grade") && data.result.status !== "IN_PROGRESS";

  return (
    <>
      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Résultats de la campagne
        </Link>
        <Button asChild variant="outline" size="sm">
          <a href={`${base}/${attemptId}/pdf`}>
            <FileText data-icon="inline-start" /> Rapport PDF
          </a>
        </Button>
      </div>
      <div className="mx-auto mb-6 max-w-3xl rounded-xl border bg-card px-5 py-4">
        <p className="text-sm text-muted-foreground">Candidat</p>
        <p className="font-medium">
          {data.candidate.name} <span className="font-normal text-muted-foreground">· {data.candidate.email}</span>
        </p>
      </div>
      <AttemptResultView
        result={data.result}
        renderItemExtra={
          canGrade
            ? (item) => (
                <details className="rounded-lg border p-4" open={item.needsManualReview && item.manualScore === null}>
                  <summary className="cursor-pointer text-sm font-medium">
                    {item.needsManualReview && item.manualScore === null ? "Noter cette réponse" : "Ajuster la note"}
                  </summary>
                  <div className="mt-3">
                    <GradeForm
                      slug={organization.slug}
                      answerId={item.answerId}
                      points={item.points}
                      initialScore={item.manualScore ?? item.autoScore}
                      initialFeedback={item.feedback}
                    />
                  </div>
                </details>
              )
            : undefined
        }
      />
    </>
  );
}
