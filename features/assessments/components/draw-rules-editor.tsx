"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { setDrawRulesAction } from "@/features/assessments/actions";
import type { BankRef } from "@/features/questions/bank";
import { DIFFICULTIES, difficultyLabels } from "@/lib/questions/labels";
import { useMutation } from "@/lib/use-mutation";
import { cn } from "@/lib/utils";
import type { DrawRule } from "@/lib/assessments/validation";
import type { Difficulty } from "@/generated/prisma/enums";

type Row = { categoryId: string; difficulty: string; count: string; points: string; available?: number };

export function DrawRulesEditor({
  bank,
  assessmentId,
  sectionId,
  rules,
  categories,
  locked,
}: {
  bank: BankRef;
  assessmentId: string;
  sectionId: string;
  rules: (DrawRule & { available: number })[];
  categories: { id: string; name: string }[];
  locked: boolean;
}) {
  const { run, pending } = useMutation();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(
    rules.map((r) => ({
      categoryId: r.categoryId ?? "",
      difficulty: r.difficulty ?? "",
      count: String(r.count),
      points: String(r.points),
      available: r.available,
    })),
  );
  const update = (i: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, j) => (j === i ? { ...row, ...patch, available: undefined } : row)));

  const save = () => {
    const parsed = rows.map((r) => ({
      categoryId: r.categoryId || null,
      difficulty: (r.difficulty || null) as Difficulty | null,
      count: Number(r.count),
      points: Number(r.points.replace(",", ".")),
    }));
    if (parsed.some((r) => !Number.isInteger(r.count) || r.count < 1 || !(r.points > 0))) {
      setError("Chaque règle demande un nombre entier de questions (au moins 1) et un barème positif.");
      return;
    }
    setError(null);
    void run(() => setDrawRulesAction(bank, assessmentId, sectionId, parsed), {
      success: "Règles de tirage enregistrées.",
      onError: (r) => setError(r.error.message),
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        À chaque tentative, les questions sont tirées au hasard parmi les questions <strong>publiées</strong> de la banque{" "}
        {bank.kind === "organization" ? "de votre organisation" : "Aptitude"} qui correspondent à chaque règle.
      </p>
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">Aucune règle de tirage.</p>
      )}
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-[1.4fr_1fr_5rem_5rem_auto]">
            <label className="text-xs text-muted-foreground">
              Catégorie
              <NativeSelect
                className="mt-1"
                disabled={locked}
                value={row.categoryId}
                onChange={(e) => update(i, { categoryId: e.target.value })}
              >
                <option value="">Toutes</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="text-xs text-muted-foreground">
              Difficulté
              <NativeSelect
                className="mt-1"
                disabled={locked}
                value={row.difficulty}
                onChange={(e) => update(i, { difficulty: e.target.value })}
              >
                <option value="">Toutes</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {difficultyLabels[d]}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="text-xs text-muted-foreground">
              Questions
              <Input
                className="mt-1 tabular"
                type="number"
                min={1}
                disabled={locked}
                value={row.count}
                onChange={(e) => update(i, { count: e.target.value })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Points/q.
              <Input
                className="mt-1 tabular"
                inputMode="decimal"
                disabled={locked}
                value={row.points}
                onChange={(e) => update(i, { points: e.target.value })}
              />
            </label>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Supprimer la règle ${i + 1}`}
              disabled={locked}
              onClick={() => setRows((current) => current.filter((_, j) => j !== i))}
            >
              <Trash2 />
            </Button>
            {row.available !== undefined && (
              <p
                className={cn(
                  "text-xs sm:col-span-5",
                  row.available < Number(row.count) ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {row.available} question(s) publiée(s) disponible(s) pour cette règle.
              </p>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!locked && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRows((current) => [...current, { categoryId: "", difficulty: "", count: "5", points: "1" }])}
          >
            <Plus data-icon="inline-start" /> Ajouter une règle
          </Button>
          <Button size="sm" onClick={save} disabled={pending}>
            {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Enregistrer les règles
          </Button>
        </div>
      )}
    </div>
  );
}
