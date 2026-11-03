"use client";

import { useRef, useState, useTransition } from "react";
import { AlertTriangle, Download, FileSpreadsheet, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createDocumentImportAction, createTabularImportAction } from "@/features/imports/actions";
import { requestUploadAction } from "@/features/questions/actions";
import type { BankRef } from "@/features/questions/bank";
import { MAX_IMPORT_ROWS, tableToRows, type ImportRow } from "@/lib/imports/rows";
import { uploadError } from "@/lib/storage-rules";
import { cn } from "@/lib/utils";

type Parsed = { fileName: string; source: "CSV" | "XLSX"; rows: (ImportRow & { _line: number })[]; unknownHeaders: string[] };

const MAX_TABLE_BYTES = 2 * 1024 * 1024;

/** Lecture du tableur dans le navigateur : seules les lignes (texte) sont envoyées au serveur. */
async function readTable(file: File): Promise<{ source: "CSV" | "XLSX"; table: unknown[][] }> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser");
    const data = await readSheet(file);
    return { source: "XLSX", table: data.map((row) => row.map((cell) => (cell instanceof Date ? cell.toISOString().slice(0, 10) : cell))) };
  }
  const Papa = (await import("papaparse")).default;
  const text = await file.text();
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  return { source: "CSV", table: result.data };
}

export function ImportUploader({ bank, templateHref }: { bank: BankRef; templateHref: string }) {
  const [mode, setMode] = useState<"table" | "document">("table");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [createCategories, setCreateCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const tableInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  const onTable = (file: File) => {
    setError(null);
    setParsed(null);
    if (!/\.(csv|xlsx)$/i.test(file.name)) return setError("Formats acceptés : .csv ou .xlsx (Excel).");
    if (file.size > MAX_TABLE_BYTES) return setError("Fichier trop lourd (2 Mo maximum).");
    startBusy(async () => {
      try {
        const { source, table } = await readTable(file);
        const { rows, unknownHeaders } = tableToRows(table);
        if (rows.length === 0) return setError("Aucune ligne de question trouvée. Vérifiez la ligne d'en-têtes (voir le modèle).");
        if (rows.length > MAX_IMPORT_ROWS) return setError(`${rows.length} lignes : la limite est de ${MAX_IMPORT_ROWS} par import.`);
        setParsed({ fileName: file.name, source, rows, unknownHeaders });
      } catch (e) {
        console.error(e);
        setError("Ce fichier n'a pas pu être lu. Enregistrez-le au format .csv ou .xlsx et réessayez.");
      }
    });
  };

  const submitTable = () =>
    parsed &&
    startBusy(async () => {
      const result = await createTabularImportAction(bank, {
        source: parsed.source,
        fileName: parsed.fileName,
        createMissingCategories: createCategories,
        rows: parsed.rows,
      });
      if (result && !result.ok) setError(result.error.message);
    });

  const onDocument = (file: File) => {
    setError(null);
    const invalid = uploadError("attachment", file);
    if (invalid) return setError(invalid);
    startBusy(async () => {
      try {
        const target = await requestUploadAction(bank, { kind: "attachment", type: file.type, size: file.size });
        if (!target.ok) return setError(target.error.message);
        const upload = await fetch(target.data.uploadUrl, { method: "PUT", headers: { "content-type": file.type, "x-upsert": "false" }, body: file });
        if (!upload.ok) return setError("L'envoi du document a échoué. Réessayez.");
        const result = await createDocumentImportAction(bank, {
          source: file.type === "application/pdf" ? "PDF" : "IMAGE",
          fileName: file.name,
          storagePath: target.data.path,
        });
        if (result && !result.ok) setError(result.error.message);
      } catch {
        toast.error("L'envoi a échoué. Vérifiez votre connexion.");
      }
    });
  };

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm sm:max-w-md">
        {(
          [
            ["table", "Tableur (CSV, Excel)", FileSpreadsheet],
            ["document", "Document (PDF, image)", FileText],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-3 py-2 font-medium transition-colors",
              mode === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {mode === "table" ? (
        <div className="mt-6 space-y-5">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Une ligne par question. Téléchargez le modèle pour connaître les colonnes ; le fichier est lu dans votre navigateur
            puis chaque ligne est vérifiée avant toute création dans la banque.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => tableInput.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
              Choisir un fichier
            </Button>
            <Button asChild variant="outline">
              <a href={templateHref}>
                <Download data-icon="inline-start" /> Modèle CSV
              </a>
            </Button>
          </div>
          <input
            ref={tableInput}
            type="file"
            hidden
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onTable(file);
              e.target.value = "";
            }}
          />

          {parsed && (
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm">
                <span className="font-medium">{parsed.fileName}</span> · {parsed.rows.length} ligne(s) détectée(s)
              </p>
              {parsed.unknownHeaders.length > 0 && (
                <p className="flex gap-2 text-sm text-warning-foreground">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Colonnes ignorées : {parsed.unknownHeaders.join(", ")}
                </p>
              )}
              <ol className="divide-y rounded-lg border bg-card text-sm">
                {parsed.rows.slice(0, 5).map((row) => (
                  <li key={row._line} className="flex gap-3 px-3 py-2">
                    <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">l. {row._line}</span>
                    <span className="w-28 shrink-0 text-muted-foreground">{row.type ?? "—"}</span>
                    <span className="line-clamp-1">{row.enonce ?? <em className="text-muted-foreground">sans énoncé</em>}</span>
                  </li>
                ))}
                {parsed.rows.length > 5 && <li className="px-3 py-2 text-muted-foreground">… et {parsed.rows.length - 5} autre(s)</li>}
              </ol>
              <label className="flex items-center gap-2.5 text-sm">
                <Switch checked={createCategories} onCheckedChange={setCreateCategories} />
                Créer les catégories qui n&apos;existent pas encore
              </label>
              <Button onClick={submitTable} disabled={busy}>
                {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Vérifier les {parsed.rows.length} ligne(s)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Le document s&apos;affiche à côté d&apos;un formulaire : vous transcrivez chaque question et sa bonne réponse.
            Aucune réponse n&apos;est extraite automatiquement ; tout est vérifié par vous avant l&apos;import.
          </p>
          <Button onClick={() => docInput.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
            Envoyer un PDF ou une image
          </Button>
          <p className="text-xs text-muted-foreground">PDF, PNG, JPEG ou WebP · 10 Mo maximum · stockage privé</p>
          <input
            ref={docInput}
            type="file"
            hidden
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onDocument(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
