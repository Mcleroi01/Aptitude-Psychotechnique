import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { PracticeSetup, StartPlatformExamButton } from "@/features/attempts/components/start-buttons";
import { formatDuration } from "@/lib/assessments/labels";
import { parseDrawRules } from "@/lib/assessments/validation";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { listPlatformExams } from "@/services/attempt-view.service";

export const metadata: Metadata = { title: "S'entraîner" };

export default async function EntrainementPage() {
  await requireUser();
  const [categories, exams] = await Promise.all([
    prisma.category.findMany({
      where: { organizationId: null, isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { questions: { where: { status: "PUBLISHED", isLatest: true, requiresManualGrading: false } } } },
      },
    }),
    listPlatformExams(),
  ]);

  return (
    <>
      <h1 className="text-3xl font-semibold">S&apos;entraîner</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Questions originales de la banque Aptitude. Elles ne proviennent d&apos;aucune épreuve officielle.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Entraînement libre</h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Sans chronomètre. Vérifiez chaque réponse pour voir aussitôt la correction et les méthodes.
          </p>
          <PracticeSetup categories={categories.map((c) => ({ id: c.id, name: c.name, questionCount: c._count.questions }))} />
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Examens blancs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            En conditions réelles : chronomètre contrôlé par le serveur, soumission automatique, correction complète à la fin.
          </p>
          {exams.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">Aucun examen blanc publié pour le moment.</p>
          ) : (
            <ul className="mt-5 divide-y border-y">
              {exams.map((exam) => {
                const questions = exam.sections.reduce(
                  (sum, s) =>
                    sum + (s.selectionMode === "FIXED" ? s._count.questions : parseDrawRules(s.drawRules).reduce((n, r) => n + r.count, 0)),
                  0,
                );
                const duration =
                  exam.timingMode === "GLOBAL"
                    ? exam.durationSeconds
                    : exam.timingMode === "PER_SECTION"
                      ? exam.sections.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0)
                      : null;
                return (
                  <li key={exam.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground tabular">
                        <Clock className="size-3.5" aria-hidden />
                        {questions} question(s) · {duration ? formatDuration(duration) : "sans limite"}
                      </p>
                    </div>
                    <StartPlatformExamButton assessmentId={exam.id} label="Commencer" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
