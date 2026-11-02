import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, ImageIcon, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { bankPaths, type BankRef } from "@/features/questions/bank";
import { QuestionRowActions } from "@/features/questions/components/question-row-actions";
import {
  CONTENT_STATUSES,
  DIFFICULTIES,
  difficultyLabels,
  QUESTION_TYPES,
  questionTypeLabels,
  statusLabels,
} from "@/lib/questions/labels";
import { listQuestions, type BankScope, type QuestionFilters } from "@/services/question.service";
import type { ContentStatus } from "@/generated/prisma/enums";

type SearchParams = Record<string, string | string[] | undefined>;

const pick = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

/** Filtres lus dans l'URL : toute valeur inconnue est ignorée. */
export function parseQuestionFilters(params: SearchParams): QuestionFilters {
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 100) : undefined;
  const page = Number(params.page);
  return {
    search: search || undefined,
    type: pick(params.type, QUESTION_TYPES),
    status: pick(params.status, CONTENT_STATUSES),
    difficulty: pick(params.difficulty, DIFFICULTIES),
    categoryId: typeof params.category === "string" && params.category.length <= 40 ? params.category || undefined : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

const statusVariant: Record<ContentStatus, "success" | "secondary" | "outline"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export async function QuestionList({
  bank,
  scope,
  filters,
  categories,
}: {
  bank: BankRef;
  scope: BankScope;
  filters: QuestionFilters;
  categories: { id: string; name: string }[];
}) {
  const paths = bankPaths(bank);
  const { questions, total, page, pageCount } = await listQuestions(scope, filters);
  const hasFilters = Boolean(filters.search || filters.type || filters.status || filters.difficulty || filters.categoryId);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.categoryId) params.set("category", filters.categoryId);
    params.set("page", String(p));
    return `${paths.questions}?${params}`;
  };

  return (
    <div className="space-y-5">
      <form method="get" className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
        <Input name="q" defaultValue={filters.search} placeholder="Rechercher dans l'énoncé" aria-label="Rechercher" />
        <NativeSelect name="type" defaultValue={filters.type ?? ""} aria-label="Format">
          <option value="">Tous les formats</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {questionTypeLabels[t]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="category" defaultValue={filters.categoryId ?? ""} aria-label="Catégorie">
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="difficulty" defaultValue={filters.difficulty ?? ""} aria-label="Difficulté">
          <option value="">Toutes difficultés</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {difficultyLabels[d]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={filters.status ?? ""} aria-label="Statut">
          <option value="">Actives (hors archives)</option>
          {CONTENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </NativeSelect>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            Filtrer
          </Button>
          {hasFilters && (
            <Button asChild variant="ghost">
              <Link href={paths.questions}>Effacer</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="text-sm text-muted-foreground tabular">
        {total} question{total > 1 ? "s" : ""}
      </p>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="font-medium">{hasFilters ? "Aucune question ne correspond aux filtres." : "La banque est vide."}</p>
          {!hasFilters && (
            <Button asChild className="mt-5">
              <Link href={paths.newQuestion}>
                <Plus data-icon="inline-start" /> Créer la première question
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Question</th>
                <th className="px-5 py-3 font-medium">Format</th>
                <th className="px-5 py-3 font-medium">Catégorie</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Modifiée</th>
                <th className="w-12 px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questions.map((q) => (
                <tr key={q.id} className="align-top">
                  <td className="max-w-md px-5 py-3">
                    <Link href={paths.question(q.id)} className="line-clamp-2 font-medium hover:underline">
                      {q.prompt}
                    </Link>
                    <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {difficultyLabels[q.difficulty]} · {String(q.defaultPoints).replace(".", ",")} pt
                      {q.version > 1 && ` · v${q.version}`}
                      {q.imagePath && <ImageIcon className="size-3.5" aria-label="Avec image" />}
                      {q.attachmentPath && <FileText className="size-3.5" aria-label="Avec document" />}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{questionTypeLabels[q.type]}</td>
                  <td className="px-5 py-3">{q.category?.name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant[q.status]}>{statusLabels[q.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground tabular">
                    {format(q.updatedAt, "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-3 py-2">
                    <QuestionRowActions bank={bank} questionId={q.id} status={q.status} editHref={paths.question(q.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground tabular">
            Page {page} sur {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(page - 1)}>Précédente</Link>
              </Button>
            )}
            {page < pageCount && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(page + 1)}>Suivante</Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
