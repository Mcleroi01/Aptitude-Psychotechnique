import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AssessmentBuilder } from "@/features/assessments/components/assessment-builder";
import { CreateAssessmentForm } from "@/features/assessments/components/create-assessment-form";
import { bankPaths, type BankRef } from "@/features/questions/bank";
import { AppError } from "@/lib/errors";
import { formatDuration, timingModeLabels } from "@/lib/assessments/labels";
import { statusLabels } from "@/lib/questions/labels";
import { ExamPreview, type PreviewAssessment } from "@/features/assessments/components/exam-preview";
import { toCandidateQuestion } from "@/lib/questions/public";
import { buildAssessmentPreview, getAssessmentDetail, listAssessments } from "@/services/assessment.service";
import { listCategories } from "@/services/category.service";
import type { BankScope } from "@/services/question.service";
import { signedReadUrl } from "@/services/storage.service";

/** Écrans communs aux évaluations de la plateforme et des organisations. */

/** Transforme une AppError NOT_FOUND en page 404. */
async function or404<T>(load: Promise<T>): Promise<T> {
  try {
    return await load;
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function AssessmentListScreen({ bank, scope, description }: { bank: BankRef; scope: BankScope; description: string }) {
  const paths = bankPaths(bank);
  const assessments = await listAssessments(scope);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Évaluations</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        </div>
        <CreateAssessmentForm bank={bank} />
      </div>

      {assessments.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="font-medium">Aucune évaluation pour le moment.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Une évaluation regroupe une ou plusieurs épreuves, avec leurs durées, barèmes et questions.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y rounded-xl border bg-card">
          {assessments.map((a) => (
            <li key={a.id}>
              <Link href={paths.assessment(a.id)} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40">
                <span>
                  <span className="font-medium">{a.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground tabular">
                    {a._count.sections} épreuve(s) ·{" "}
                    {a.timingMode === "GLOBAL" ? formatDuration(a.durationSeconds) : timingModeLabels[a.timingMode].label}
                    {a._count.campaigns > 0 && ` · ${a._count.campaigns} campagne(s)`} · modifiée le{" "}
                    {format(a.updatedAt, "d MMM yyyy", { locale: fr })}
                  </span>
                </span>
                <Badge variant={a.status === "PUBLISHED" ? "success" : "secondary"}>
                  {a.status === "PUBLISHED" ? "Prête" : statusLabels[a.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export async function AssessmentPreviewScreen({ bank, scope, id }: { bank: BankRef; scope: BankScope; id: string }) {
  const { detail, sections } = await or404(buildAssessmentPreview(scope, id));

  const preview: PreviewAssessment = {
    title: detail.title,
    instructions: detail.instructions,
    timingMode: detail.timingMode,
    durationSeconds: detail.durationSeconds,
    sections: await Promise.all(
      sections.map(async ({ section, questions }) => ({
        id: section.id,
        title: section.title,
        instructions: section.instructions,
        durationSeconds: section.durationSeconds,
        navigationMode: section.navigationMode,
        random: section.selectionMode === "RANDOM",
        questions: await Promise.all(
          questions.map(async (q) => {
            const [imageUrl, attachmentUrl] = await Promise.all([
              signedReadUrl("image", q.imagePath),
              signedReadUrl("attachment", q.attachmentPath),
            ]);
            return {
              ...toCandidateQuestion(q, {
                imageUrl,
                attachment: attachmentUrl ? { name: q.attachmentName ?? "Document", url: attachmentUrl } : null,
              }),
              points: q.points,
            };
          }),
        ),
      })),
    ),
  };

  return (
    <>
      <Link
        href={bankPaths(bank).assessment(id)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour à l&apos;évaluation
      </Link>
      <h1 className="mt-3 mb-6 text-3xl font-semibold">Aperçu de l&apos;examen</h1>
      <ExamPreview assessment={preview} />
    </>
  );
}

export async function AssessmentBuilderScreen({ bank, scope, id }: { bank: BankRef; scope: BankScope; id: string }) {
  const [assessment, categories] = await Promise.all([or404(getAssessmentDetail(scope, id)), listCategories(scope)]);
  return (
    <>
      <Link
        href={bankPaths(bank).assessments}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Évaluations
      </Link>
      <div className="mt-3">
        <AssessmentBuilder bank={bank} assessment={assessment} categories={categories.map(({ id, name }) => ({ id, name }))} />
      </div>
    </>
  );
}
