"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAssessmentAction } from "@/features/assessments/actions";
import type { BankRef } from "@/features/questions/bank";
import { useMutation } from "@/lib/use-mutation";

export function CreateAssessmentForm({ bank }: { bank: BankRef }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { run, pending } = useMutation();

  if (!open) {
    return (
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Nouvelle évaluation
      </Button>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => createAssessmentAction(bank, { title }), {
          onError: (r) => setError(r.error.fieldErrors?.title?.[0] ?? r.error.message),
        });
      }}
    >
      <div>
        <Input
          autoFocus
          className="h-9 sm:w-72"
          placeholder="Titre de l'évaluation"
          aria-label="Titre de l'évaluation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Créer
      </Button>
      <Button type="button" variant="ghost" size="lg" onClick={() => setOpen(false)}>
        Annuler
      </Button>
    </form>
  );
}
