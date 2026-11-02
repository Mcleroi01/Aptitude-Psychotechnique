"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteCategoryAction, saveCategoryAction } from "@/features/questions/actions";
import type { BankRef } from "@/features/questions/bank";

type Category = { id: string; name: string; description: string; questionCount: number };
type Draft = { id: string | null; name: string; description: string };

export function CategoryManager({ bank, categories }: { bank: BankRef; categories: Category[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveCategoryAction(bank, draft.id, { name: draft.name, description: draft.description });
      if (!result.ok) return setError(result.error.fieldErrors?.name?.[0] ?? result.error.message);
      toast.success(draft.id ? "Catégorie modifiée." : "Catégorie créée.");
      setDraft(null);
      setError(null);
      router.refresh();
    });
  };

  const remove = (category: Category) =>
    startTransition(async () => {
      const result = await deleteCategoryAction(bank, category.id);
      if (!result.ok) return void toast.error(result.error.message);
      toast.success("Catégorie supprimée.");
      router.refresh();
    });

  const editor = (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <Input
        autoFocus
        aria-label="Nom de la catégorie"
        placeholder="Nom de la catégorie"
        value={draft?.name ?? ""}
        onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
      />
      <Textarea
        aria-label="Description"
        placeholder="Description (facultatif)"
        rows={2}
        value={draft?.description ?? ""}
        onChange={(e) => setDraft((d) => d && { ...d, description: e.target.value })}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Enregistrer
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setDraft(null);
            setError(null);
          }}
        >
          Annuler
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-4">
      {draft?.id === null ? (
        editor
      ) : (
        <Button variant="outline" onClick={() => setDraft({ id: null, name: "", description: "" })}>
          <Plus data-icon="inline-start" /> Nouvelle catégorie
        </Button>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune catégorie. Les questions peuvent aussi rester sans catégorie.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {categories.map((category) =>
            draft?.id === category.id ? (
              <li key={category.id} className="p-2">
                {editor}
              </li>
            ) : (
              <li key={category.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{category.name}</p>
                  {category.description && <p className="mt-0.5 text-sm text-muted-foreground">{category.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground tabular">
                    {category.questionCount} question{category.questionCount > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Modifier ${category.name}`}
                    onClick={() => setDraft({ id: category.id, name: category.name, description: category.description })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer ${category.name}`}
                    disabled={pending || category.questionCount > 0}
                    title={category.questionCount > 0 ? "Contient des questions" : undefined}
                    onClick={() => remove(category)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
