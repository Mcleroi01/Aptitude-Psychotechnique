import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * État de santé pour la surveillance (Vercel, UptimeRobot…) : vérifie la
 * connexion à la base sans rien révéler de la configuration.
 */
export async function GET() {
  const started = Date.now();
  let database: "ok" | "indisponible" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "indisponible";
  }
  return Response.json(
    { status: database === "ok" ? "ok" : "dégradé", database, durationMs: Date.now() - started },
    { status: database === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
