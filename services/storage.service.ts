import "server-only";
import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";
import { UPLOAD_RULES, uploadError, type UploadKind } from "@/lib/storage-rules";
import { getSupabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase-server";

const BUCKET_BY_KIND: Record<UploadKind, string> = {
  image: STORAGE_BUCKETS.questionImages,
  attachment: STORAGE_BUCKETS.documents,
};

const READ_URL_TTL_SECONDS = 60 * 60;

/** Dossier logique dans le préfixe d'une banque : questions ou bibliothèque. */
export type StorageFolder = "questions" | "library";

/** Préfixe de stockage d'une banque : chaque organisation a son propre dossier. */
export function bankStoragePrefix(organizationId: string | null): string {
  return organizationId ? `org-${organizationId}` : "platform";
}

/**
 * Prépare un envoi direct du navigateur vers Supabase (URL signée à usage
 * unique) : le fichier ne transite pas par la fonction serverless, dont la
 * taille de requête est limitée sur Vercel.
 */
export async function createUploadTarget(
  prefix: string,
  kind: UploadKind,
  file: { type: string; size: number },
  folder: StorageFolder = "questions",
): Promise<{ path: string; uploadUrl: string }> {
  const error = uploadError(kind, file);
  if (error) throw new AppError("VALIDATION", error);

  const extension = UPLOAD_RULES[kind].types[file.type as keyof (typeof UPLOAD_RULES)[typeof kind]["types"]];
  const path = `${prefix}/${folder}/${randomUUID()}.${extension}`;
  const { data, error: storageError } = await getSupabaseAdmin()
    .storage.from(BUCKET_BY_KIND[kind])
    .createSignedUploadUrl(path);
  if (storageError || !data) {
    console.error("[storage] createSignedUploadUrl", storageError);
    throw new AppError("INTERNAL", "L'envoi de fichier est momentanément indisponible.");
  }
  return { path, uploadUrl: data.signedUrl };
}

/** Empêche de rattacher à une question un fichier d'une autre banque. */
export function assertOwnedPath(prefix: string, path: string | null, folder: StorageFolder = "questions") {
  if (path && !(path.startsWith(`${prefix}/${folder}/`) && !path.includes(".."))) {
    throw new AppError("FORBIDDEN", "Fichier non autorisé pour cette banque de questions.");
  }
}

/** URL de lecture temporaire, ou null si le stockage n'est pas disponible. */
export async function signedReadUrl(
  kind: UploadKind,
  path: string | null,
  options: { ttlSeconds?: number; downloadName?: string } = {},
): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET_BY_KIND[kind])
      .createSignedUrl(path, options.ttlSeconds ?? READ_URL_TTL_SECONDS, options.downloadName ? { download: options.downloadName } : undefined);
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("[storage] createSignedUrl", error);
    return null;
  }
}

/** Suppression au mieux : un fichier orphelin ne doit pas faire échouer l'action. */
export async function removeFiles(kind: UploadKind, paths: (string | null)[]) {
  const existing = paths.filter((p): p is string => Boolean(p));
  if (existing.length === 0) return;
  try {
    await getSupabaseAdmin().storage.from(BUCKET_BY_KIND[kind]).remove(existing);
  } catch (error) {
    console.error("[storage] remove", error);
  }
}
