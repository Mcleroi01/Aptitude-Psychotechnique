"use client";

import { Fragment } from "react";
import { Check, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionResponse } from "@/lib/questions/answer-key";
import { BLANK_PATTERN } from "@/lib/questions/labels";
import type { CandidateQuestion } from "@/lib/questions/public";
import { cn } from "@/lib/utils";

export type ViewFeedback = { correctLabels: string[] };

type Props = {
  question: CandidateQuestion;
  response: QuestionResponse | null;
  onChange?: (response: QuestionResponse | null) => void;
  disabled?: boolean;
  /** Correction affichée après validation (aperçu, revue) */
  feedback?: ViewFeedback | null;
  /** Champ texte de la réponse numérique (conserve la saisie brute, ex. « 12, ») */
  numericDraft?: string;
  onNumericDraftChange?: (value: string) => void;
};

/**
 * Affichage d'une question côté candidat. Ne reçoit qu'une CandidateQuestion,
 * jamais la correction ; celle-ci n'est passée (feedback) qu'après validation.
 */
export function QuestionView({ question, response, onChange, disabled, feedback, numericDraft, onNumericDraftChange }: Props) {
  const set = (value: QuestionResponse | null) => onChange?.(value);

  return (
    <div className="space-y-5">
      {question.type !== "FILL_BLANK" && (
        <p className="text-[1.05rem] leading-relaxed font-medium whitespace-pre-line">{question.prompt}</p>
      )}

      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire, non optimisable
        <img src={question.imageUrl} alt="Illustration de la question" className="max-h-80 rounded-lg border bg-white object-contain" />
      )}

      {question.attachment && (
        <a
          href={question.attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          {question.attachment.name}
        </a>
      )}

      {(question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") && (
        <ChoiceList
          question={question}
          selected={response && "label" in response && response.label ? [response.label] : []}
          onToggle={(label) => set({ label })}
          disabled={disabled}
          feedback={feedback}
          name={`q-${question.id}`}
        />
      )}

      {question.type === "MULTIPLE_CHOICE" && (
        <>
          <p className="text-sm text-muted-foreground">Plusieurs réponses possibles.</p>
          <ChoiceList
            multiple
            question={question}
            selected={response && "labels" in response ? response.labels : []}
            onToggle={(label) => {
              const current = response && "labels" in response ? response.labels : [];
              const labels = current.includes(label) ? current.filter((l) => l !== label) : [...current, label];
              set({ labels });
            }}
            disabled={disabled}
            feedback={feedback}
            name={`q-${question.id}`}
          />
        </>
      )}

      {question.type === "NUMERIC" && (
        <div className="flex max-w-xs items-center gap-3">
          <Input
            inputMode="decimal"
            aria-label="Votre réponse"
            placeholder="Votre réponse"
            className="h-11 text-base tabular"
            disabled={disabled}
            value={numericDraft ?? (response && "value" in response ? String(response.value).replace(".", ",") : "")}
            onChange={(e) => {
              onNumericDraftChange?.(e.target.value);
              const cleaned = e.target.value.replace(/\s/g, "").replace(",", ".");
              set(/^-?\d+(\.\d+)?$/.test(cleaned) ? { value: Number(cleaned) } : null);
            }}
          />
          {question.unit && <span className="text-muted-foreground">{question.unit}</span>}
        </div>
      )}

      {question.type === "TEXT" && (
        <Textarea
          aria-label="Votre réponse"
          placeholder="Votre réponse"
          rows={4}
          disabled={disabled}
          value={response && "text" in response ? response.text : ""}
          onChange={(e) => set({ text: e.target.value })}
        />
      )}

      {question.type === "FILL_BLANK" && (
        <FillBlank
          prompt={question.prompt}
          values={response && "blanks" in response ? response.blanks : []}
          onChange={(blanks) => set({ blanks })}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function ChoiceList({
  question,
  selected,
  onToggle,
  multiple = false,
  disabled,
  feedback,
  name,
}: {
  question: CandidateQuestion;
  selected: string[];
  onToggle: (label: string) => void;
  multiple?: boolean;
  disabled?: boolean;
  feedback?: ViewFeedback | null;
  name: string;
}) {
  return (
    <ul className="grid gap-2.5" role={multiple ? "group" : "radiogroup"} aria-label="Propositions">
      {question.options.map((option) => {
        const isSelected = selected.includes(option.label);
        const isCorrect = feedback?.correctLabels.includes(option.label);
        const state = !feedback ? null : isCorrect ? "correct" : isSelected ? "wrong" : null;
        return (
          <li key={option.label}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                isSelected && !feedback && "border-primary bg-primary/5",
                state === "correct" && "border-success bg-success-muted",
                state === "wrong" && "border-destructive bg-destructive/5",
                disabled ? "cursor-default" : "hover:bg-muted/60",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                className="sr-only"
                checked={isSelected}
                disabled={disabled}
                onChange={() => onToggle(option.label)}
              />
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center border text-xs font-semibold",
                  multiple ? "rounded-md" : "rounded-full",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "bg-background",
                )}
                aria-hidden
              >
                {option.label}
              </span>
              <span className="flex-1">{option.text}</span>
              {state === "correct" && <Check className="size-4 text-success" aria-label="Bonne réponse" />}
              {state === "wrong" && <X className="size-4 text-destructive" aria-label="Réponse incorrecte" />}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function FillBlank({
  prompt,
  values,
  onChange,
  disabled,
}: {
  prompt: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const parts = prompt.split(BLANK_PATTERN);
  return (
    <p className="text-[1.05rem] leading-[2.4] font-medium whitespace-pre-line">
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <input
              aria-label={`Trou ${i + 1}`}
              disabled={disabled}
              value={values[i] ?? ""}
              onChange={(e) => {
                const next = Array.from({ length: parts.length - 1 }, (_, j) => values[j] ?? "");
                next[i] = e.target.value;
                onChange(next);
              }}
              className="mx-1 inline-block h-9 w-28 rounded-md border bg-background px-2 text-center align-middle text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </Fragment>
      ))}
    </p>
  );
}
