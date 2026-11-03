"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createDocumentAction, deleteDocumentAction, requestLibraryUploadAction, updateDocumentAction } from "@/features/library/actions";
import { DOCUMENT_CATEGORIES, documentCategoryLabels, VERIFICATION_STATUSES, verificationLabels, type DocumentInput } from "@/lib/library";
import { uploadError } from "@/lib/storage-rules";
import { useMutation } from "@/lib/use-mutation";

export type ManagedDocument = DocumentInput & { id: string; fileType: string; fileSize: number };

const empty: DocumentInput = {
  title: "",
  description: "",
  category: "PREPARATION",
  source: "",
  documentDate: null,
  verificationStatus: "PLATFORM_CONTENT",
  requiresAuth: false,
  isPublished: false,
};

export function LibraryManager({ documents }: { documents: ManagedDocument[] }) {
  const { run, pending } = useMutation();
  const [editing, setEditing] = useState<ManagedDocument | "new" | null>(null);

  return (
    <div className="space-y-6">
      {editing === null ? (
        <Button onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" /> Ajouter un document
        </Button>
      ) : (
        <DocumentForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">La bibliothèque est vide.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
              <FileText className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{doc.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {documentCategoryLabels[doc.category]} · {doc.source} · {(doc.fileSize / 1024 / 1024).toFixed(1).replace(".", ",")} Mo
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={verificationLabels[doc.verificationStatus].variant}>{verificationLabels[doc.verificationStatus].label}</Badge>
                  <Badge variant={doc.isPublished ? "success" : "secondary"}>{doc.isPublished ? "Publié" : "Brouillon"}</Badge>
                  {doc.requiresAuth && <Badge variant="outline">Compte requis</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label={`Modifier ${doc.title}`} onClick={() => setEditing(doc)}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Supprimer ${doc.title}`}
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`Supprimer définitivement « ${doc.title} » et son fichier ?`)) {
                      void run(() => deleteDocumentAction(doc.id), { success: "Document supprimé." });
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DocumentForm({ initial, onDone }: { initial: ManagedDocument | null; onDone: () => void }) {
  const { run, pending } = useMutation();
  const [values, setValues] = useState<DocumentInput>(initial ?? empty);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const input = useRef<HTMLInputElement>(null);
  const set = <K extends keyof DocumentInput>(key: K, value: DocumentInput[K]) => setValues((v) => ({ ...v, [key]: value }));
  const err = (key: string) => errors[key]?.map((message) => ({ message }));

  const save = async () => {
    setErrors({});
    if (initial) {
      const ok = await run(() => updateDocumentAction(initial.id, values), {
        success: "Document enregistré.",
        onError: (r) => setErrors(r.error.fieldErrors ?? { form: [r.error.message] }),
      });
      if (ok) onDone();
      return;
    }
    if (!file) return setErrors({ file: ["Choisissez un fichier"] });
    const invalid = uploadError("attachment", file);
    if (invalid) return setErrors({ file: [invalid] });

    setUploading(true);
    try {
      const target = await requestLibraryUploadAction({ type: file.type, size: file.size });
      if (!target.ok) return setErrors({ file: [target.error.message] });
      const response = await fetch(target.data.uploadUrl, { method: "PUT", headers: { "content-type": file.type, "x-upsert": "false" }, body: file });
      if (!response.ok) return setErrors({ file: ["L'envoi du fichier a échoué."] });
      const ok = await run(() => createDocumentAction({ values, storagePath: target.data.path, fileType: file.type, fileSize: file.size }), {
        success: "Document ajouté.",
        onError: (r) => setErrors(r.error.fieldErrors ?? { form: [r.error.message] }),
      });
      if (ok) onDone();
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="font-heading text-base font-semibold">{initial ? "Modifier le document" : "Nouveau document"}</h2>
      {!initial && (
        <div>
          <Button type="button" variant="outline" onClick={() => input.current?.click()}>
            <Upload data-icon="inline-start" /> {file ? file.name : "Choisir un fichier"}
          </Button>
          <input ref={input} type="file" hidden accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="mt-1.5 text-xs text-muted-foreground">PDF ou image · 10 Mo maximum · stockage privé</p>
          {errors.file && <p className="mt-1 text-sm text-destructive">{errors.file[0]}</p>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="d-title">Titre</FieldLabel>
          <Input id="d-title" value={values.title} onChange={(e) => set("title", e.target.value)} />
          <FieldError errors={err("title")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="d-category">Catégorie</FieldLabel>
          <NativeSelect id="d-category" value={values.category} onChange={(e) => set("category", e.target.value as DocumentInput["category"])}>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {documentCategoryLabels[c]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="d-description">Description</FieldLabel>
        <Textarea id="d-description" rows={2} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={Boolean(errors.source)} className="sm:col-span-2">
          <FieldLabel htmlFor="d-source">Source</FieldLabel>
          <Input id="d-source" placeholder="Émetteur, site, référence" value={values.source} onChange={(e) => set("source", e.target.value)} />
          <FieldError errors={err("source")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="d-date">Date du document</FieldLabel>
          <Input id="d-date" type="date" value={values.documentDate ?? ""} onChange={(e) => set("documentDate", e.target.value || null)} />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="d-verification">Statut de vérification</FieldLabel>
        <NativeSelect
          id="d-verification"
          value={values.verificationStatus}
          onChange={(e) => set("verificationStatus", e.target.value as DocumentInput["verificationStatus"])}
        >
          {VERIFICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {verificationLabels[s].label}
            </option>
          ))}
        </NativeSelect>
        <FieldDescription>{verificationLabels[values.verificationStatus].hint}</FieldDescription>
      </Field>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2.5">
          <Switch checked={values.isPublished} onCheckedChange={(c) => set("isPublished", c)} /> Publié
        </label>
        <label className="flex items-center gap-2.5">
          <Switch checked={values.requiresAuth} onCheckedChange={(c) => set("requiresAuth", c)} /> Réservé aux comptes connectés
        </label>
      </div>
      {errors.form && <p className="text-sm text-destructive">{errors.form[0]}</p>}
      <div className="flex gap-2">
        <Button onClick={save} disabled={pending || uploading}>
          {(pending || uploading) && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Enregistrer
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </section>
  );
}
