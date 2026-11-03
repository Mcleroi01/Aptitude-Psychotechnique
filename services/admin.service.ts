import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OrgStatus } from "@/generated/prisma/enums";
import { accountChangeRefusal, type AccountChange } from "@/lib/admin-rules";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

/** Administration de la plateforme (super-administrateur uniquement, vérifié par l'appelant). */

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getPlatformStats() {
  const since = new Date(Date.now() - 30 * DAY_MS);
  const [users, newUsers, organizations, suspended, platformQuestions, privateQuestions, attempts, guestAttempts, campaigns] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "SUSPENDED" } }),
      prisma.question.count({ where: { organizationId: null, isLatest: true, status: "PUBLISHED" } }),
      prisma.question.count({ where: { organizationId: { not: null }, isLatest: true, status: { not: "ARCHIVED" } } }),
      prisma.assessmentAttempt.count({ where: { startedAt: { gte: since } } }),
      prisma.assessmentAttempt.count({ where: { startedAt: { gte: since }, userId: null } }),
      prisma.campaign.count({ where: { status: "PUBLISHED" } }),
    ]);
  return { users, newUsers, organizations, suspended, platformQuestions, privateQuestions, attempts, guestAttempts, campaigns };
}

const PAGE_SIZE = 25;

export async function listOrganizations(search?: string) {
  return prisma.organization.findMany({
    where: search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      memberships: { where: { role: "OWNER" }, take: 1, select: { user: { select: { email: true } } } },
      _count: { select: { memberships: true, questions: true, campaigns: true } },
    },
  });
}

/** Suspension : les membres perdent l'accès immédiatement (appartenance relue à chaque requête). */
export async function setOrganizationStatus(organizationId: string, status: OrgStatus) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
  if (!organization) throw new AppError("NOT_FOUND", "Organisation introuvable.");
  await prisma.organization.update({
    where: { id: organizationId },
    data: { status, suspendedAt: status === "SUSPENDED" ? new Date() : null },
  });
}

export async function listUsers(options: { search?: string; page?: number }) {
  const where: Prisma.UserWhereInput = options.search
    ? { OR: [{ email: { contains: options.search, mode: "insensitive" } }, { name: { contains: options.search, mode: "insensitive" } }] }
    : {};
  const page = Math.max(1, options.page ?? 1);
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true,
        isActive: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { memberships: true, attempts: true } },
      },
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), users };
}

/**
 * Activation, désactivation ou changement de rôle. Une désactivation prend
 * effet à la prochaine revérification du jeton de session (5 minutes au plus).
 */
export async function changeAccount(actorId: string, userId: string, change: AccountChange) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, platformRole: true, isActive: true } });
  if (!target) throw new AppError("NOT_FOUND", "Compte introuvable.");
  const activeSuperAdmins = await prisma.user.count({ where: { platformRole: "SUPER_ADMIN", isActive: true } });
  const refusal = accountChangeRefusal({ actorId, target, activeSuperAdmins, change });
  if (refusal) throw new AppError("FORBIDDEN", refusal);

  await prisma.user.update({
    where: { id: userId },
    data: change.kind === "role" ? { platformRole: change.role } : { isActive: change.kind === "activate" },
  });
}
