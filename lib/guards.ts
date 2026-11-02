import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { can, type OrgPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { OrgContext, SessionUser } from "@/types";

/** Utilisateur de la session courante (mémorisé pour la durée de la requête). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.platformRole) return null;
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    platformRole: user.platformRole,
  };
});

/**
 * Appartenance lue en base à chaque requête (et non dans le JWT) : un membre
 * retiré ou une organisation suspendue perd l'accès immédiatement.
 */
const loadOrgContext = cache(async (userId: string, slug: string) => {
  return prisma.membership.findFirst({
    where: { userId, organization: { slug } },
    select: { role: true, organization: { select: { id: true, name: true, slug: true, status: true } } },
  });
});

type LoadedMembership = NonNullable<Awaited<ReturnType<typeof loadOrgContext>>>;

function toOrgContext(user: SessionUser, { role, organization }: LoadedMembership): OrgContext {
  return { user, role, organization: { id: organization.id, name: organization.name, slug: organization.slug } };
}

/** Organisations dont l'utilisateur est membre. */
export const getUserOrganizations = cache(async (userId: string) => {
  return prisma.membership.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { role: true, organization: { select: { id: true, name: true, slug: true, status: true } } },
  });
});

// ─── Pages (Server Components) : redirigent ─────────────────────────────────

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.platformRole !== "SUPER_ADMIN") redirect("/espace");
  return user;
}

/** Espace organisation : 404 pour un non-membre (l'existence n'est pas révélée). */
export async function requireOrgMember(slug: string, permission?: OrgPermission): Promise<OrgContext> {
  const user = await requireUser();
  const membership = await loadOrgContext(user.id, slug);
  if (!membership) notFound();
  if (membership.organization.status === "SUSPENDED") redirect("/organisation-suspendue");
  if (permission && !can(membership.role, permission)) redirect(`/organisation/${slug}`);
  return toOrgContext(user, membership);
}

// ─── Server Actions et Route Handlers : lèvent une AppError ─────────────────

export async function assertUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Veuillez vous connecter pour continuer.");
  return user;
}

export async function assertSuperAdmin(): Promise<SessionUser> {
  const user = await assertUser();
  if (user.platformRole !== "SUPER_ADMIN") {
    throw new AppError("FORBIDDEN", "Accès réservé aux administrateurs de la plateforme.");
  }
  return user;
}

export async function assertOrgPermission(slug: string, permission: OrgPermission): Promise<OrgContext> {
  const user = await assertUser();
  const membership = await loadOrgContext(user.id, slug);
  if (!membership) throw new AppError("NOT_FOUND", "Organisation introuvable.");
  if (membership.organization.status === "SUSPENDED") {
    throw new AppError("FORBIDDEN", "Cette organisation est suspendue.");
  }
  if (!can(membership.role, permission)) {
    throw new AppError("FORBIDDEN", "Votre rôle ne permet pas cette action.");
  }
  return toOrgContext(user, membership);
}
