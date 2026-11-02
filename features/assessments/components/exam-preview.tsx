"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Flag, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionView } from "@/features/questions/components/question-view";
import { formatDuration, formatPoints, navigationModeLabels } from "@/lib/assessments/labels";
import type { QuestionResponse } from "@/lib/questions/answer-key";
import type { CandidateQuestion } from "@/lib/questions/public";
import { cn } from "@/lib/utils";
import type { NavigationMode, TimingMode } from "@/generated/prisma/enums";

export type PreviewSection = {
  id: string;
  title: string;
  instructions: string | null;
  durationSeconds: number | null;
  navigationMode: NavigationMode;
  random: boolean;
  questions: (CandidateQuestion & { points: number })[];
};

export type PreviewAssessment = {
  title: string;
  instructions: string | null;
  timingMode: TimingMode;
  durationSeconds: number | null;
  sections: PreviewSection[];
};

type Step = { kind: "intro" } | { kind: "section"; section: number } | { kind: "question"; section: number; index: number } | { kind: "end" };

/**
 * Parcours de l'évaluation tel que le candidat le verra. Rien n'est enregistré
 * et aucun chronomètre ne tourne : les durées sont seulement indiquées.
 */
export function ExamPreview({ assessment }: { assessment: PreviewAssessment }) {
  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [responses, setResponses] = useState<Record<string, QuestionResponse | null>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const durationOf = (section: PreviewSection) =>
    assessment.timingMode === "PER_SECTION" ? formatDuration(section.durationSeconds) : null;

  const next = () => {
    if (step.kind === "intro") return setStep(assessment.sections.length ? { kind: "section", section: 0 } : { kind: "end" });
    if (step.kind === "section") {
      const section = assessment.sections[step.section];
      return setStep(section.questions.length ? { kind: "question", section: step.section, index: 0 } : advanceSection(step.section));
    }
    if (step.kind === "question") {
      const section = assessment.sections[step.section];
      return setStep(step.index + 1 < section.questions.length ? { ...step, index: step.index + 1 } : advanceSection(step.section));
    }
  };
  const advanceSection = (current: number): Step =>
    current + 1 < assessment.sections.length ? { kind: "section", section: current + 1 } : { kind: "end" };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 flex items-start gap-2 rounded-lg border bg-secondary/60 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Aperçu : aucune réponse n&apos;est enregistrée et le chronomètre ne tourne pas. Les épreuves à tirage aléatoire
        montrent un exemple de tirage, différent à chaque chargement.
      </p>

      <div className="rounded-xl border bg-card">
        {step.kind === "intro" && (
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">{assessment.title}</h2>
            {assessment.instructions && <p className="mt-3 whitespace-pre-line text-muted-foreground">{assessment.instructions}</p>}
            <p className="mt-5 flex items-center gap-2 text-sm">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              {assessment.timingMode === "NONE"
                ? "Sans limite de temps"
                : assessment.timingMode === "GLOBAL"
                  ? `Durée totale : ${formatDuration(assessment.durationSeconds)}`
                  : "Chaque épreuve a sa propre durée"}
            </p>
            <ol className="mt-6 divide-y border-y">
              {assessment.sections.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span>
                    <span className="mr-2 font-mono text-muted-foreground tabular">{i + 1}.</span>
                    {s.title}
                  </span>
                  <span className="text-muted-foreground tabular">
                    {s.questions.length} question(s)
                    {durationOf(s) && ` · ${durationOf(s)}`}
                  </span>
                </li>
              ))}
            </ol>
            <Button className="mt-6" size="lg" onClick={next}>
              Commencer l&apos;aperçu <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        )}

        {step.kind === "section" && (
          <SectionIntro section={assessment.sections[step.section]} index={step.section} duration={durationOf(assessment.sections[step.section])} onStart={next} />
        )}

        {step.kind === "question" && (() => {
          const section = assessment.sections[step.section];
          const question = section.questions[step.index];
          return (
            <div>
              <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3 text-sm">
                <span className="font-medium">{section.title}</span>
                <span className="flex items-center gap-2 text-muted-foreground tabular">
                  Question {step.index + 1} / {section.questions.length}
                  <Badge variant="secondary">{formatPoints(question.points)}</Badge>
                </span>
              </header>
              <nav aria-label="Questions de l'épreuve" className="flex flex-wrap gap-1.5 border-b px-5 py-3">
                {section.questions.map((q, i) => (
                  <button
                    key={q.id}
                    disabled={section.navigationMode === "FORWARD_ONLY"}
                    onClick={() => setStep({ ...step, index: i })}
                    aria-current={i === step.index ? "step" : undefined}
                    className={cn(
                      "size-8 rounded-md border text-xs font-medium tabular disabled:cursor-default",
                      i === step.index ? "border-primary bg-primary text-primary-foreground" : responses[q.id] ? "bg-muted" : "bg-background",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </nav>
              <div className="p-5 sm:p-6">
                <QuestionView
                  key={question.id}
                  question={question}
                  response={responses[question.id] ?? null}
                  onChange={(r) => setResponses((all) => ({ ...all, [question.id]: r }))}
                  numericDraft={drafts[question.id]}
                  onNumericDraftChange={(d) => setDrafts((all) => ({ ...all, [question.id]: d }))}
                />
              </div>
              <footer className="flex justify-between gap-2 border-t px-5 py-3">
                <Button
                  variant="outline"
                  disabled={step.index === 0 || section.navigationMode === "FORWARD_ONLY"}
                  onClick={() => setStep({ ...step, index: step.index - 1 })}
                >
                  <ArrowLeft data-icon="inline-start" /> Précédente
                </Button>
                <Button onClick={next}>
                  {step.index + 1 < section.questions.length ? "Suivante" : "Terminer l'épreuve"} <ArrowRight data-icon="inline-end" />
                </Button>
              </footer>
            </div>
          );
        })()}

        {step.kind === "end" && (
          <div className="p-6 text-center sm:p-8">
            <Flag className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold">Fin de l&apos;aperçu</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lors d&apos;une vraie tentative, les réponses sont enregistrées au fil de l&apos;eau et corrigées par le serveur.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                setResponses({});
                setDrafts({});
                setStep({ kind: "intro" });
              }}
            >
              Recommencer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionIntro({
  section,
  index,
  duration,
  onStart,
}: {
  section: PreviewSection;
  index: number;
  duration: string | null;
  onStart: () => void;
}) {
  return (
    <div className="p-6 sm:p-8">
      <p className="text-sm font-medium text-muted-foreground">Épreuve {index + 1}</p>
      <h2 className="mt-1 text-2xl font-semibold">{section.title}</h2>
      {section.instructions && <p className="mt-3 whitespace-pre-line text-muted-foreground">{section.instructions}</p>}
      <ul className="mt-5 space-y-1.5 text-sm">
        <li>{section.questions.length} question(s){section.random && " tirées au hasard"}</li>
        {duration && <li>Durée : {duration}</li>}
        <li>{navigationModeLabels[section.navigationMode]}</li>
      </ul>
      {section.questions.length === 0 && (
        <p className="mt-4 text-sm text-destructive">Cette épreuve ne contient encore aucune question.</p>
      )}
      <Button className="mt-6" size="lg" onClick={onStart}>
        Commencer l&apos;épreuve <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}
