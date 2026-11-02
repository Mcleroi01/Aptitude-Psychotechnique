"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestUploadAction } from "@/features/questions/actions";
import type { BankRef } from "@/features/questions/bank";
import { UPLOAD_RULES, uploadError, type UploadKind } from "@/lib/storage-rules";

export type UploadedFile = { path: string; name: string; previewUrl: string | null };

type Props = {
  bank: BankRef;
  kind: UploadKind;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
};

/**
 * Envoi direct vers Supabase Storage : le serveur contrôle le type et la taille
 * puis délivre une URL signée à usage unique ; le fichier ne transite pas par Vercel.
 */
export function FileField({ bank, kind, value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rule = UPLOAD_RULES[kind];
  const Icon = kind === "image" ? ImageIcon : FileText;

  const upload = async (file: File) => {
    setError(null);
    const invalid = uploadError(kind, file);
    if (invalid) return setError(invalid);

    setPending(true);
    try {
      const target = await requestUploadAction(bank, { kind, type: file.type, size: file.size });
      if (!target.ok) return setError(target.error.message);
      const response = await fetch(target.data.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type, "x-upsert": "false" },
        body: file,
      });
      if (!response.ok) return setError("L'envoi a échoué. Réessayez.");
      onChange({ path: target.data.path, name: file.name, previewUrl: URL.createObjectURL(file) });
    } catch {
      setError("L'envoi a échoué. Vérifiez votre connexion.");
    } finally {
      setPending(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
          {kind === "image" && value.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou URL signée temporaire
            <img src={value.previewUrl} alt="" className="size-12 rounded-md border object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-md bg-muted">
              <Icon className="size-5 text-muted-foreground" aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm">{value.name}</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(null)} aria-label={`Retirer le ${rule.label}`}>
            <Trash2 />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
          {kind === "image" ? "Ajouter une image" : "Joindre un document"}
        </Button>
      )}
      <input
        ref={input}
        type="file"
        hidden
        accept={Object.keys(rule.types).join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {kind === "image" ? "PNG, JPEG, WebP ou GIF" : "PDF ou image"} · {rule.maxBytes / 1024 / 1024} Mo maximum
      </p>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
