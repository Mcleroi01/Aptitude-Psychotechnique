import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/types";

/** Utilisateur de la session courante (mémorisé pour la durée de la requête). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.role) return null;
  return { id: user.id, name: user.name ?? "", email: user.email ?? "", role: user.role };
});

// ─── Pages (Server Components) : redirigent ─────────────────────────────────

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/espace");
  return user;
}

// ─── Server Actions et Route Handlers : lèvent une AppError ─────────────────

export async function assertUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Veuillez vous connecter pour continuer.");
  return user;
}

export async function assertAdmin(): Promise<SessionUser> {
  const user = await assertUser();
  if (user.role !== "ADMIN") throw new AppError("FORBIDDEN", "Accès réservé aux administrateurs.");
  return user;
}
