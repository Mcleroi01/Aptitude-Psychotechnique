import "server-only";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/slug";

const STATUS: Partial<Record<AppError["code"], number>> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
};

/** Convertit une erreur en réponse HTTP pour les Route Handlers (détails internes masqués). */
export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(error.message, { status: STATUS[error.code] ?? 500, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  console.error("[route]", error);
  return new Response("Erreur inattendue.", { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
}

/** Réponse de téléchargement ; jamais mise en cache (données personnelles). */
export function downloadResponse(body: BodyInit, name: string, extension: "csv" | "pdf"): Response {
  const filename = `${slugify(name, 60)}.${extension}`;
  return new Response(body, {
    headers: {
      "content-type": extension === "csv" ? "text/csv; charset=utf-8" : "application/pdf",
      "content-disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
    },
  });
}
