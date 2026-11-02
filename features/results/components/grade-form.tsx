"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { gradeAnswerAction } from "@/features/results/actions";
import { useMutation } from "@/lib/use-mutation";

/** Notation manuelle d'une réponse : note sur le barème et commentaire facultatif. */
export function GradeForm({
  slug,
  answerId,
  points,
  initialScore,
  initialFeedback,
  submitLabel = "Enregistrer la note",
}: {
  slug: string;
  answerId: string;
  points: number;
  initialScore: number | null;
  initialFeedback: string | null;
  submitLabel?: string;
}) {
  const { run, pending } = useMutation();
  const [score, setScore] = useState(initialScore?.toString().replace(".", ",") ?? "");
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const value = Number(score.replace(",", "."));
    if (score.trim() === "" || !Number.isFinite(value) || value < 0 || value > points) {
      setError(`Saisissez une note entre 0 et ${String(points).replace(".", ",")}.`);
      return;
    }
    setError(null);
    void run(() => gradeAnswerAction(slug, answerId, { score: value, feedback }), {
      success: "Note enregistrée.",
      onError: (r) => setError(r.error.message),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">
          Note
          <span className="mt-1 flex items-center gap-2">
            <Input
              className="w-24 text-right tabular"
              inputMode="decimal"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              aria-describedby={`max-${answerId}`}
            />
            <span id={`max-${answerId}`} className="font-normal text-muted-foreground">
              / {String(points).replace(".", ",")} pt
            </span>
          </span>
        </label>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setScore("0")}>
            0
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setScore(String(points).replace(".", ","))}>
            Max
          </Button>
        </div>
      </div>
      <Textarea
        rows={2}
        placeholder="Commentaire pour le candidat (facultatif)"
        aria-label="Commentaire pour le candidat"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button size="sm" onClick={save} disabled={pending}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        {submitLabel}
      </Button>
    </div>
  );
}
