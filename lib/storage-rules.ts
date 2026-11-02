/** Règles d'envoi de fichiers, partagées par le navigateur (contrôle immédiat) et le serveur. */
export const UPLOAD_RULES = {
  image: {
    label: "image",
    maxBytes: 2 * 1024 * 1024,
    types: { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" },
  },
  attachment: {
    label: "document",
    maxBytes: 10 * 1024 * 1024,
    types: { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" },
  },
} as const satisfies Record<string, { label: string; maxBytes: number; types: Record<string, string> }>;

export type UploadKind = keyof typeof UPLOAD_RULES;

export function uploadError(kind: UploadKind, file: { type: string; size: number }): string | null {
  const rule = UPLOAD_RULES[kind];
  if (!(file.type in rule.types)) {
    return kind === "image" ? "Format accepté : PNG, JPEG, WebP ou GIF." : "Format accepté : PDF, PNG, JPEG ou WebP.";
  }
  if (file.size > rule.maxBytes) return `Fichier trop lourd (${rule.maxBytes / 1024 / 1024} Mo maximum).`;
  if (file.size === 0) return "Fichier vide.";
  return null;
}
