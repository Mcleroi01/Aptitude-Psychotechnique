"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  moveSectionQuestionAction,
  removeSectionQuestionAction,
  updateQuestionScoreAction,
} from "@/features/assessments/actions";
import { QuestionPicker } from "@/features/assessments/components/question-picker";
import type { BuilderSection } from "@/features/assessments/components/section-card";
import type { BankRef } from "@/features/questions/bank";
import { difficultyLabels, questionTypeLabels, statusLabels } from "@/lib/questions/labels";
import { useMutation } from "@/lib/use-mutation";

export function SectionQuestions({
  bank,
  assessmentId,
  section,
  locked,
}: {
  bank: BankRef;
  assessmentId: string;
  section: BuilderSection;
  locked: boolean;
}) {
  const { run, pending } = useMutation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const items = section.questions;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune question. Ajoutez-en depuis vos banques.
        </p>
      ) : (
        <ol className="divide-y rounded-lg border">
          {items.map((item, i) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <span className="w-6 text-right font-mono text-xs text-muted-foreground tabular">{i + 1}</span>
              <div className="min-w-0 flex-1 basis-60">
                <p className="line-clamp-1 text-sm font-medium">{item.question.prompt}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {questionTypeLabels[item.question.type]} · {difficultyLabels[item.question.difficulty]}
                  {item.question.category && ` · ${item.question.category.name}`}
                  {item.question.organizationId === null && bank.kind === "organization" && (
                    <Badge variant="sky">Banque Aptitude</Badge>
                  )}
                  {(item.question.status !== "PUBLISHED" || !item.question.isLatest) && (
                    <Badge variant="warning">
                      {!item.question.isLatest ? "Version remplacée" : statusLabels[item.question.status]}
                    </Badge>
                  )}
                </p>
              </div>
              <ScoreInputs
                key={`${item.points}-${item.negativePoints}`}
                disabled={locked || pending}
                points={item.points}
                negativePoints={item.negativePoints}
                onSave={(score) =>
                  run(() => updateQuestionScoreAction(bank, assessmentId, item.id, score), { success: "Barème mis à jour." })
                }
              />
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Monter"
                  disabled={locked || pending || i === 0}
                  onClick={() => run(() => moveSectionQuestionAction(bank, assessmentId, item.id, "up"))}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Descendre"
                  disabled={locked || pending || i === items.length - 1}
                  onClick={() => run(() => moveSectionQuestionAction(bank, assessmentId, item.id, "down"))}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Retirer de l'épreuve"
                  disabled={locked || pending}
                  onClick={() => run(() => removeSectionQuestionAction(bank, assessmentId, item.id))}
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {!locked && (
        <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <Plus data-icon="inline-start" /> Ajouter des questions
        </Button>
      )}
      {pickerOpen && (
        <QuestionPicker bank={bank} assessmentId={assessmentId} sectionId={section.id} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

/** Barème de la question dans l'épreuve, enregistré quand le champ perd le focus. */
function ScoreInputs({
  points,
  negativePoints,
  disabled,
  onSave,
}: {
  points: number;
  negativePoints: number;
  disabled: boolean;
  onSave: (score: { points: number; negativePoints: number }) => void;
}) {
  const [p, setP] = useState(String(points));
  const [n, setN] = useState(String(negativePoints));

  const commit = () => {
    const next = { points: Number(p.replace(",", ".")), negativePoints: Number(n.replace(",", ".") || "0") };
    if (next.points === points && next.negativePoints === negativePoints) return;
    if (!(next.points > 0) || !(next.negativePoints >= 0)) {
      setP(String(points));
      setN(String(negativePoints));
      return;
    }
    onSave(next);
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <label className="flex items-center gap-1">
        <span className="sr-only">Points</span>
        <Input
          className="h-8 w-16 text-right tabular"
          inputMode="decimal"
          value={p}
          disabled={disabled}
          onChange={(e) => setP(e.target.value)}
          onBlur={commit}
          aria-label="Points pour une bonne réponse"
        />
        pt
      </label>
      <label className="flex items-center gap-1" title="Points retirés pour une mauvaise réponse">
        −
        <Input
          className="h-8 w-14 text-right tabular"
          inputMode="decimal"
          value={n}
          disabled={disabled}
          onChange={(e) => setN(e.target.value)}
          onBlur={commit}
          aria-label="Points retirés pour une mauvaise réponse"
        />
      </label>
    </div>
  );
}
