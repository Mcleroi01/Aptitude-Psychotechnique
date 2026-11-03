"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CircleAlert, Loader2, Pencil, Plus, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import {
  addImportItemAction,
  cancelImportAction,
  commitImportAction,
  setImportItemStatusAction,
  updateImportItemAction,
} from "@/features/imports/actions";
import { bankPaths, type BankRef } from "@/features/questions/bank";
import { QuestionEditor } from "@/features/questions/components/question-editor";
import { questionTypeLabels } from "@/lib/questions/labels";
import { useMutation } from "@/lib/use-mutation";
import { cn } from "@/lib/utils";
import { emptyEditorValues, type QuestionEditorValues } from "@/schemas/question";
import type { ImportItemStatus, ImportSource, ImportStatus } from "@/generated/prisma/enums";

export type ReviewItem = {
  id: string;
  rowNumber: number | null;
  status: ImportItemStatus;
  errors: string[];
  questionId: string | null;
  values: QuestionEditorValues;
};

type Props = {
  bank: BankRef;
  job: { id: string; status: ImportStatus; source: ImportSource; fileName: string; documentUrl: string | null; items: ReviewItem[] };
  categories: { id: string; name: string }[];
};

type Editing = { kind: "edit"; item: ReviewItem } | { kind: "new" } | null;

export function ImportReview({ bank, job, categories }: Props) {
  const router = useRouter();
  const { run, pending } = useMutation();
  const [editing, setEditing] = useState<Editing>(null);
  const [publish, setPublish] = useState(false);
  const open = job.status === "IN_REVIEW";
  const isDocument = job.source === "PDF" || job.source === "IMAGE";
  const paths = bankPaths(bank);

  const counts = {
    approved: job.items.filter((i) => i.status === "APPROVED" && !i.questionId).length,
    toFix: job.items.filter((i) => i.status === "PENDING").length,
    rejected: job.items.filter((i) => i.status === "REJECTED").length,
    imported: job.items.filter((i) => i.questionId).length,
  };

  /** Enregistrement depuis l'éditeur : « brouillon » = à revoir, « publier » = approuver. */
  const saveFromEditor = async (values: QuestionEditorValues, status: "DRAFT" | "PUBLISHED") => {
    const result =
      editing?.kind === "edit"
        ? await updateImportItemAction(bank, job.id, editing.item.id, values, status === "PUBLISHED")
        : await addImportItemAction(bank, job.id, values, status === "PUBLISHED");
    if (!result.ok) return result.error.message;
    toast.success(result.data.length ? "Ligne enregistrée, avec des points à corriger." : "Ligne enregistrée.");
    setEditing(null);
    router.refresh();
    return null;
  };

  const setStatus = (item: ReviewItem, status: "APPROVED" | "REJECTED" | "PENDING") =>
    run(() => setImportItemStatusAction(bank, job.id, item.id, status));

  return (
    <div className={cn("grid gap-6", isDocument && "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-start")}>
      {isDocument && (
        <section className="overflow-hidden rounded-2xl border bg-card xl:sticky xl:top-6">
          <h2 className="border-b px-4 py-3 text-sm font-medium">Document source</h2>
          {job.documentUrl ? (
            job.source === "PDF" ? (
              <iframe src={job.documentUrl} title={`Document : ${job.fileName}`} className="h-[75dvh] w-full bg-muted" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire
              <img src={job.documentUrl} alt={`Document : ${job.fileName}`} className="max-h-[75dvh] w-full object-contain bg-muted" />
            )
          ) : (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Document momentanément indisponible.</p>
          )}
        </section>
      )}

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="success">{counts.approved} prête(s) à importer</Badge>
          <Badge variant={counts.toFix ? "warning" : "secondary"}>{counts.toFix} à vérifier</Badge>
          <Badge variant="secondary">{counts.rejected} rejetée(s)</Badge>
          {counts.imported > 0 && <Badge variant="sky">{counts.imported} importée(s)</Badge>}
        </div>

        {open && isDocument && (
          <Button onClick={() => setEditing({ kind: "new" })}>
            <Plus data-icon="inline-start" /> Transcrire une question
          </Button>
        )}

        {job.items.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            {isDocument ? "Aucune question transcrite pour le moment." : "Aucune ligne."}
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {job.items.map((item) => (
              <li key={item.id} className={cn("px-4 py-3.5", item.status === "REJECTED" && "opacity-60")}>
                <div className="flex flex-wrap items-start gap-3">
                  <span className="w-12 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
                    {isDocument ? `#${item.rowNumber}` : `l. ${item.rowNumber}`}
                  </span>
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="line-clamp-2 text-sm font-medium">{item.values.prompt || <em className="text-muted-foreground">Sans énoncé</em>}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{questionTypeLabels[item.values.type]}</p>
                    {item.errors.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-destructive">
                        {item.errors.map((e) => (
                          <li key={e} className="flex gap-1.5">
                            <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden /> {e}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.questionId ? (
                      <Badge variant="sky">Importée</Badge>
                    ) : (
                      <>
                        <Badge variant={item.status === "APPROVED" ? "success" : item.status === "REJECTED" ? "secondary" : "warning"}>
                          {item.status === "APPROVED" ? "Approuvée" : item.status === "REJECTED" ? "Rejetée" : "À vérifier"}
                        </Badge>
                        {open && (
                          <>
                            <Button variant="ghost" size="icon-sm" aria-label="Modifier la ligne" onClick={() => setEditing({ kind: "edit", item })}>
                              <Pencil />
                            </Button>
                            {item.status !== "APPROVED" && item.errors.length === 0 && (
                              <Button variant="ghost" size="icon-sm" aria-label="Approuver" disabled={pending} onClick={() => setStatus(item, "APPROVED")}>
                                <Check />
                              </Button>
                            )}
                            {item.status === "REJECTED" ? (
                              <Button variant="ghost" size="icon-sm" aria-label="Rétablir" disabled={pending} onClick={() => setStatus(item, "PENDING")}>
                                <Undo2 />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon-sm" aria-label="Rejeter" disabled={pending} onClick={() => setStatus(item, "REJECTED")}>
                                <X />
                              </Button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {open ? (
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm">
              Importer en
              <NativeSelect value={publish ? "publish" : "draft"} onChange={(e) => setPublish(e.target.value === "publish")} className="w-40">
                <option value="draft">brouillon</option>
                <option value="publish">publiées</option>
              </NativeSelect>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Abandonner cet import ? Les lignes non importées seront ignorées.")) {
                    void run(() => cancelImportAction(bank, job.id), { success: "Import abandonné." }).then((ok) => ok && router.push(paths.imports));
                  }
                }}
              >
                Abandonner
              </Button>
              <Button
                disabled={pending || counts.approved === 0}
                onClick={() =>
                  run(() => commitImportAction(bank, job.id, publish), {
                    success: (r) => `${r.created} question(s) ajoutée(s) à la banque${publish ? "" : " en brouillon"}.`,
                  })
                }
              >
                {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Importer {counts.approved} question(s)
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Import {job.status === "COMMITTED" ? "terminé" : "abandonné"}.{" "}
            <Link href={paths.questions} className="font-medium text-primary underline-offset-4 hover:underline">
              Voir la banque de questions
            </Link>
          </p>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{editing?.kind === "new" ? "Transcrire une question" : "Corriger la ligne"}</DialogTitle>
            <DialogDescription>
              Vérifiez l&apos;énoncé et surtout la bonne réponse : rien n&apos;est importé sans votre validation.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <QuestionEditor
              key={editing.kind === "edit" ? editing.item.id : "new"}
              bank={bank}
              questionId={null}
              initialValues={editing.kind === "edit" ? editing.item.values : emptyEditorValues()}
              initialMedia={{
                image: editing.kind === "edit" && editing.item.values.imagePath ? { path: editing.item.values.imagePath, name: "Image jointe", previewUrl: null } : null,
                attachment:
                  editing.kind === "edit" && editing.item.values.attachmentPath
                    ? { path: editing.item.values.attachmentPath, name: editing.item.values.attachmentName ?? "Document", previewUrl: null }
                    : null,
              }}
              categories={categories}
              listPath={paths.importJob(job.id)}
              versionedOnSave={false}
              onSave={saveFromEditor}
              labels={{ draft: "Enregistrer (à vérifier)", publish: "Enregistrer et approuver" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
