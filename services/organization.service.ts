import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

/** Limite anti-abus : nombre d'organisations qu'un même compte peut posséder. */
const MAX_OWNED_ORGANIZATIONS = 3;

async function availableSlug(name: string, tx: Prisma.TransactionClient): Promise<string> {
  const base = slugify(name);
  const taken = await tx.organization.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
  const used = new Set(taken.map((o) => o.slug));
  if (!used.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Crée une organisation dont l'utilisateur devient propriétaire. */
export async function createOrganization(ownerId: string, name: string) {
  const owned = await prisma.membership.count({ where: { userId: ownerId, role: "OWNER" } });
  if (owned >= MAX_OWNED_ORGANIZATIONS) {
    throw new AppError("FORBIDDEN", `Un compte peut posséder au maximum ${MAX_OWNED_ORGANIZATIONS} organisations.`);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name, slug: await availableSlug(name, tx) },
        select: { id: true, slug: true },
      });
      await tx.membership.create({ data: { userId: ownerId, organizationId: organization.id, role: "OWNER" } });
      return organization;
    });
  } catch (error) {
    // Deux créations simultanées du même nom : l'utilisateur peut simplement réessayer.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("CONFLICT", "Ce nom vient d'être utilisé. Réessayez.");
    }
    throw error;
  }
}

export async function getOrganizationMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, createdAt: true, user: { select: { name: true, email: true } } },
  });
}
