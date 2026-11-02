"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addQuestionsAction, searchPickerQuestionsAction } from "@/features/assessments/actions";
import type { BankRef } from "@/features/questions/bank";
import { difficultyLabels, questionTypeLabels, statusLabels } from "@/lib/questions/labels";
import { useMutation } from "@/lib/use-mutation";
import { cn } from "@/lib/utils";
import type { ContentStatus, Difficulty, QuestionType } from "@/generated/prisma/enums";

type PickerQuestion = {
  id: string;
  prompt: string;
  type: QuestionType;
  difficulty: Difficulty;
  status: ContentStatus;
  defaultPoints: number;
  category: { name: string } | null;
  inSection: boolean;
};

export function QuestionPicker({
  bank,
  assessmentId,
  sectionId,
  onClose,
}: {
  bank: BankRef;
  assessmentId: string;
  sectionId: string;
  onClose: () => void;
}) {
  const [source, setSource] = useState<"own" | "platform">("own");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PickerQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, startLoading] = useTransition();
  const { run, pending } = useMutation();

  const load = useCallback(
    (query: string, from: "own" | "platform") =>
      startLoading(async () => {
        const result = await searchPickerQuestionsAction(bank, sectionId, { search: query, source: from });
        if (result.ok) {
          setResults(result.data);
          setError(null);
        } else setError(result.error.message);
      }),
    [bank, sectionId],
  );

  // Recherche au fil de la saisie, avec un léger délai.
  useEffect(() => {
    const timer = setTimeout(() => load(search, source), 250);
    return () => clearTimeout(timer);
  }, [search, source, load]);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () =>
    run(() => addQuestionsAction(bank, assessmentId, sectionId, [...selected]), {
      success: (count) => `${count} question(s) ajoutée(s).`,
    }).then((ok) => ok && onClose());

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter des questions</DialogTitle>
          <DialogDescription>
            Les questions sont liées, pas copiées : une correction dans la banque profite à toutes les évaluations en
            brouillon.
          </DialogDescription>
        </DialogHeader>

        {bank.kind === "organization" && (
          <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
            {(
              [
                ["own", "Ma banque"],
                ["platform", "Banque Aptitude"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={source === value}
                onClick={() => setSource(value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
                  source === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            autoFocus
            className="pl-9"
            placeholder="Rechercher dans l'énoncé"
            aria-label="Rechercher une question"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="-mx-1 min-h-40 flex-1 overflow-y-auto px-1">
          {error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : loading && results.length === 0 ? (
            <p className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Chargement" />
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune question trouvée.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {results.map((q) => (
                <li key={q.id}>
                  <label
                    className={cn(
                      "flex items-start gap-3 px-3 py-2.5",
                      q.inSection ? "cursor-default opacity-60" : "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4"
                      disabled={q.inSection}
                      checked={q.inSection || selected.has(q.id)}
                      onChange={() => toggle(q.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-medium">{q.prompt}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {questionTypeLabels[q.type]} · {difficultyLabels[q.difficulty]}
                        {q.category && ` · ${q.category.name}`}
                        {q.inSection && <Badge variant="secondary">Déjà dans l&apos;épreuve</Badge>}
                        {q.status !== "PUBLISHED" && <Badge variant="warning">{statusLabels[q.status]}</Badge>}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={add} disabled={selected.size === 0 || pending}>
            {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Ajouter {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
