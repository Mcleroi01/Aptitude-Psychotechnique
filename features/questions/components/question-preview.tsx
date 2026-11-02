"use client";

import { useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionView, type ViewFeedback } from "@/features/questions/components/question-view";
import type { QuestionResponse } from "@/lib/questions/answer-key";
import { gradeResponse, type GradeResult } from "@/lib/questions/grading";
import { countBlanks, optionLabel, questionTypeLabels } from "@/lib/questions/labels";
import { describeExpected } from "@/lib/questions/correction";
import type { CandidateQuestion } from "@/lib/questions/public";
import { questionEditorSchema, toQuestionData, type QuestionEditorValues } from "@/schemas/question";

type Media = { imageUrl: string | null; attachment: { name: string; url: string } | null };

/** Aperçu tel que le candidat verra la question, avec test de la correction. */
export function QuestionPreview({ values, media }: { values: QuestionEditorValues; media: Media }) {
  const [state, setState] = useState<{ type: string; response: QuestionResponse | null; draft: string }>({
    type: values.type,
    response: null,
    draft: "",
  });
  const [result, setResult] = useState<{ grade: GradeResult; feedback: ViewFeedback; expected: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // Changer de format réinitialise la réponse de test.
  const current = state.type === values.type ? state : { type: values.type, response: null, draft: "" };

  const question = toPreviewQuestion(values, media);

  const check = () => {
    const parsed = questionEditorSchema.safeParse(values);
    if (!parsed.success) {
      setResult(null);
      setProblem("Complétez la question (champs signalés) pour tester la correction.");
      return;
    }
    setProblem(null);
    const data = toQuestionData(parsed.data);
    const grade = gradeResponse(data, current.response, { points: data.defaultPoints });
    setResult({
      grade,
      feedback: { correctLabels: data.options.filter((o) => o.isCorrect).map((o) => o.label) },
      expected: describeExpected(data.type, data.answerKey),
    });
  };

  const reset = () => {
    setState({ type: values.type, response: null, draft: "" });
    setResult(null);
    setProblem(null);
  };

  return (
    <section className="rounded-xl border bg-card" aria-label="Aperçu candidat">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Eye className="size-4 text-muted-foreground" aria-hidden /> Aperçu candidat
        </h2>
        <Badge variant="secondary">{questionTypeLabels[values.type]}</Badge>
      </header>
      <div className="p-5">
        {values.prompt?.trim() ? (
          <QuestionView
            question={question}
            response={current.response}
            onChange={(response) => {
              setState({ ...current, response });
              setResult(null);
            }}
            numericDraft={current.draft}
            onNumericDraftChange={(draft) => setState((s) => ({ ...(s.type === values.type ? s : current), draft }))}
            feedback={result?.feedback}
          />
        ) : (
          <p className="text-sm text-muted-foreground">L&apos;aperçu apparaît dès que vous saisissez l&apos;énoncé.</p>
        )}
      </div>
      <footer className="space-y-3 border-t px-5 py-4">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={check} disabled={!values.prompt?.trim()}>
            Tester la correction
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw data-icon="inline-start" /> Réinitialiser
          </Button>
        </div>
        {problem && <p className="text-sm text-muted-foreground">{problem}</p>}
        {result && <GradeSummary result={result.grade} expected={result.expected} />}
      </footer>
    </section>
  );
}

function GradeSummary({ result, expected }: { result: GradeResult; expected: string }) {
  const labels: Record<GradeResult["status"], { text: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    correct: { text: "Correct", variant: "success" },
    partial: { text: "Partiellement correct", variant: "warning" },
    incorrect: { text: "Incorrect", variant: "destructive" },
    unanswered: { text: "Sans réponse", variant: "secondary" },
    pending_review: { text: "À corriger manuellement", variant: "secondary" },
  };
  const { text, variant } = labels[result.status];
  return (
    <div className="space-y-1.5 text-sm" aria-live="polite">
      <p className="flex items-center gap-2">
        <Badge variant={variant}>{text}</Badge>
        {result.score !== null && <span className="tabular text-muted-foreground">{String(result.score).replace(".", ",")} pt</span>}
      </p>
      {expected && <p className="text-muted-foreground">Attendu : {expected}</p>}
    </div>
  );
}

function toPreviewQuestion(values: QuestionEditorValues, media: Media): CandidateQuestion {
  const options =
    values.type === "TRUE_FALSE"
      ? [
          { label: "V", text: "Vrai" },
          { label: "F", text: "Faux" },
        ]
      : values.type === "SINGLE_CHOICE" || values.type === "MULTIPLE_CHOICE"
        ? (values.options ?? []).map((o, i) => ({ label: optionLabel(i), text: o.text || "…" }))
        : [];
  return {
    id: "apercu",
    type: values.type,
    prompt: values.prompt ?? "",
    imageUrl: media.imageUrl,
    attachment: media.attachment,
    options,
    blankCount: values.type === "FILL_BLANK" ? countBlanks(values.prompt ?? "") : 0,
    unit: values.type === "NUMERIC" && values.numericUnit ? values.numericUnit : null,
  };
}

