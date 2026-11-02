"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { startCampaignAttemptAction, startPlatformExamAction, startPracticeAction } from "@/features/attempts/actions";
import { DIFFICULTIES, difficultyLabels } from "@/lib/questions/labels";
import type { ActionResult } from "@/lib/errors";
import type { Difficulty } from "@/generated/prisma/enums";

/** Bouton qui lance une action serveur redirigeant vers la tentative. */
function StartButton({ label, action, size = "lg" }: { label: string; action: () => Promise<ActionResult>; size?: "lg" | "xl" }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size={size}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await action();
          if (result && !result.ok) toast.error(result.error.message);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
      {label} <ArrowRight data-icon="inline-end" />
    </Button>
  );
}

export function StartPlatformExamButton({ assessmentId, label }: { assessmentId: string; label: string }) {
  return <StartButton label={label} action={() => startPlatformExamAction(assessmentId)} />;
}

export function StartCampaignButton({ campaignId, token, label }: { campaignId: string; token?: string; label: string }) {
  return <StartButton size="xl" label={label} action={() => startCampaignAttemptAction(campaignId, token)} />;
}

const COUNTS = [5, 10, 20] as const;

export function PracticeSetup({ categories }: { categories: { id: string; name: string; questionCount: number }[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState<number>(10);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Catégorie
          <NativeSelect className="mt-1.5" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} disabled={c.questionCount === 0}>
                {c.name} ({c.questionCount})
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="text-sm font-medium">
          Niveau
          <NativeSelect className="mt-1.5" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Tous les niveaux</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {difficultyLabels[d]}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Nombre de questions</legend>
        <div className="mt-1.5 flex gap-2">
          {COUNTS.map((n) => (
            <Button key={n} type="button" variant={count === n ? "default" : "outline"} aria-pressed={count === n} onClick={() => setCount(n)}>
              {n}
            </Button>
          ))}
        </div>
      </fieldset>
      <StartButton
        label="Commencer l'entraînement"
        action={() =>
          startPracticeAction({ categoryId: categoryId || null, difficulty: (difficulty || null) as Difficulty | null, count })
        }
      />
    </div>
  );
}
