"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, Copy, Eye, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  addSectionAction,
  deleteAssessmentAction,
  duplicateAssessmentAction,
  setAssessmentPublishedAction,
} from "@/features/assessments/actions";
import { AssessmentSettingsForm } from "@/features/assessments/components/assessment-settings-form";
import { SectionCard } from "@/features/assessments/components/section-card";
import { bankPaths, type BankRef } from "@/features/questions/bank";
import { formatDuration, formatPoints, timingModeLabels } from "@/lib/assessments/labels";
import { sectionMaxScore, sectionQuestionCount } from "@/lib/assessments/validation";
import { statusLabels } from "@/lib/questions/labels";
import { useMutation } from "@/lib/use-mutation";
import type { AssessmentDetail } from "@/services/assessment.service";

export function AssessmentBuilder({
  bank,
  assessment,
  categories,
}: {
  bank: BankRef;
  assessment: AssessmentDetail;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { run, pending } = useMutation();
  const paths = bankPaths(bank);
  const { locked, issues } = assessment;
  const globalIssues = issues.filter((i) => !i.sectionId);
  const totals = assessment.validation.sections.reduce(
    (acc, s) => ({ questions: acc.questions + sectionQuestionCount(s), points: acc.points + sectionMaxScore(s) }),
    { questions: 0, points: 0 },
  );
  const totalDuration =
    assessment.timingMode === "GLOBAL"
      ? assessment.durationSeconds
      : assessment.timingMode === "PER_SECTION"
        ? assessment.sections.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0)
        : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold">{assessment.title}</h1>
            <Badge variant={assessment.status === "PUBLISHED" ? "success" : "secondary"}>
              {assessment.status === "PUBLISHED" ? "Prête" : statusLabels[assessment.status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground tabular">
            {assessment.sections.length} épreuve(s) · {totals.questions} question(s) · {formatPoints(totals.points)} ·{" "}
            {assessment.timingMode === "NONE" ? timingModeLabels.NONE.label : formatDuration(totalDuration)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={paths.assessmentPreview(assessment.id)}>
              <Eye data-icon="inline-start" /> Aperçu
            </Link>
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => run(() => duplicateAssessmentAction(bank, assessment.id))}>
            <Copy data-icon="inline-start" /> Dupliquer
          </Button>
          {!locked &&
            (assessment.status === "PUBLISHED" ? (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => run(() => setAssessmentPublishedAction(bank, assessment.id, false), { success: "Évaluation repassée en brouillon." })}
              >
                Repasser en brouillon
              </Button>
            ) : (
              <Button
                disabled={pending || issues.length > 0}
                onClick={() => run(() => setAssessmentPublishedAction(bank, assessment.id, true), { success: "Évaluation prête à l'emploi." })}
              >
                <CircleCheck data-icon="inline-start" /> Valider l&apos;évaluation
              </Button>
            ))}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Supprimer l'évaluation"
            disabled={pending}
            onClick={async () => {
              if (!window.confirm("Supprimer cette évaluation ? Si elle a déjà servi, elle sera archivée.")) return;
              const result = await deleteAssessmentAction(bank, assessment.id);
              if (!result.ok) return void toast.error(result.error.message);
              toast.success(result.data === "deleted" ? "Évaluation supprimée." : "Évaluation archivée.");
              router.push(paths.assessments);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {locked && (
        <p className="flex gap-2.5 rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          Cette évaluation est utilisée par une campagne publiée ou a déjà des tentatives : elle n&apos;est plus
          modifiable, afin que tous les candidats passent la même épreuve. Dupliquez-la pour créer une variante.
        </p>
      )}

      {!locked && issues.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <CircleAlert className="size-4" aria-hidden /> {issues.length} point(s) à régler avant de valider
          </p>
          {globalIssues.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-6">
              {globalIssues.map((issue) => (
                <li key={issue.message}>{issue.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:items-start">
        <section className="rounded-xl border bg-card p-5 sm:p-6 xl:sticky xl:top-6">
          <h2 className="mb-5 font-heading text-base font-semibold">Paramètres généraux</h2>
          <AssessmentSettingsForm
            key={assessment.updatedAt.toString()}
            bank={bank}
            assessmentId={assessment.id}
            initial={assessment}
            disabled={locked}
          />
        </section>

        <div className="space-y-4">
          <h2 className="font-heading text-base font-semibold">Épreuves</h2>
          {assessment.sections.map((section, index) => (
            <SectionCard
              key={section.id}
              bank={bank}
              assessmentId={assessment.id}
              section={section}
              index={index}
              total={assessment.sections.length}
              timingMode={assessment.timingMode}
              categories={categories}
              locked={locked}
              issues={issues.filter((i) => i.sectionId === section.id).map((i) => i.message)}
            />
          ))}
          {!locked && (
            <Button variant="outline" disabled={pending} onClick={() => run(() => addSectionAction(bank, assessment.id), { success: "Épreuve ajoutée." })}>
              <Plus data-icon="inline-start" /> Ajouter une épreuve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
