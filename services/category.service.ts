import "server-only";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { BankScope } from "@/services/question.service";

export async function listCategories(scope: BankScope) {
  return prisma.category.findMany({
    where: { organizationId: scope.organizationId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      _count: { select: { questions: { where: { isLatest: true, status: { not: "ARCHIVED" } } } } },
    },
  });
}

async function uniqueSlug(scope: BankScope, name: string, excludeId?: string) {
  const base = slugify(name, 60);
  const taken = await prisma.category.findMany({
    where: { organizationId: scope.organizationId, slug: { startsWith: base }, NOT: excludeId ? { id: excludeId } : undefined },
    select: { slug: true },
  });
  const used = new Set(taken.map((c) => c.slug));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

export async function createCategory(scope: BankScope, input: { name: string; description: string }) {
  const last = await prisma.category.aggregate({ where: { organizationId: scope.organizationId }, _max: { order: true } });
  return prisma.category.create({
    data: {
      ...input,
      organizationId: scope.organizationId,
      slug: await uniqueSlug(scope, input.name),
      order: (last._max.order ?? -1) + 1,
    },
    select: { id: true },
  });
}

export async function updateCategory(scope: BankScope, id: string, input: { name: string; description: string }) {
  const category = await prisma.category.findFirst({ where: { id, organizationId: scope.organizationId } });
  if (!category) throw new AppError("NOT_FOUND", "Catégorie introuvable.");
  // Le slug des catégories de la banque Aptitude sert aux pages publiques : on le conserve.
  const slug = scope.organizationId ? await uniqueSlug(scope, input.name, id) : category.slug;
  await prisma.category.update({ where: { id }, data: { ...input, slug } });
}

export async function deleteCategory(scope: BankScope, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, organizationId: scope.organizationId },
    select: { _count: { select: { questions: true } } },
  });
  if (!category) throw new AppError("NOT_FOUND", "Catégorie introuvable.");
  if (category._count.questions > 0) {
    throw new AppError("CONFLICT", "Cette catégorie contient des questions : déplacez-les ou supprimez-les d'abord.");
  }
  await prisma.category.delete({ where: { id } });
}
