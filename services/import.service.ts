import "server-only";
import type { ImportSource, Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { convertRow, MAX_IMPORT_ROWS, normalizeHeader, type ImportRow } from "@/lib/imports/rows";
import { questionEditorSchema, toQuestionData, type QuestionEditorValues } from "@/schemas/question";
import { createCategory } from "@/services/category.service";
import { createQuestion, type BankScope } from "@/services/question.service";
import { assertOwnedPath, bankStoragePrefix } from "@/services/storage.service";

/**
 * Import de questionnaires. Rien n'est créé dans la banque tant qu'une
 * personne n'a pas validé chaque ligne : les lignes vivent d'abord dans un lot
 * (ImportJob / ImportItem) que l'on corrige, approuve ou rejette.
 */

type ItemPayload = { values: QuestionEditorValues };

const jobWhere = (scope: BankScope, jobId: string) => ({ id: jobId, organizationId: scope.organizationId });

/** Erreurs de validation lisibles d'une question saisie ou corrigée. */
function validationErrors(values: unknown): string[] {
  const parsed = questionEditorSchema.safeParse(values);
  return parsed.success ? [] : [...new Set(parsed.error.issues.map((i) => i.message))];
}

async function categoryMap(scope: BankScope) {
  const categories = await prisma.category.findMany({ where: { organizationId: scope.organizationId }, select: { id: true, name: true, slug: true } });
  const map = new Map<string, string>();
  for (const c of categories) {
    map.set(normalizeHeader(c.name), c.id);
    map.set(normalizeHeader(c.slug), c.id);
  }
  return map;
}

/** Lot issu d'un fichier CSV ou Excel lu dans le navigateur. */
export async function createTabularJob(
  scope: BankScope,
  userId: string,
  input: { source: "CSV" | "XLSX"; fileName: string; rows: (ImportRow & { _line: number })[]; createMissingCategories: boolean },
) {
  if (input.rows.length === 0) throw new AppError("VALIDATION", "Le fichier ne contient aucune ligne de question.");
  if (input.rows.length > MAX_IMPORT_ROWS) {
    throw new AppError("VALIDATION", `Le fichier dépasse ${MAX_IMPORT_ROWS} lignes : découpez-le en plusieurs imports.`);
  }

  let categories = await categoryMap(scope);
  if (input.createMissingCategories) {
    const missing = [...new Set(input.rows.map((r) => r.categorie?.trim()).filter((n): n is string => Boolean(n)))].filter(
      (name) => !categories.has(normalizeHeader(name)) && slugify(name, 60) !== "organisation",
    );
    for (const name of missing.slice(0, 50)) await createCategory(scope, { name: name.slice(0, 80), description: "" });
    if (missing.length) categories = await categoryMap(scope);
  }

  const converted = input.rows.map((row) => convertRow(row, categories));
  return prisma.importJob.create({
    data: {
      organizationId: scope.organizationId,
      source: input.source,
      status: "IN_REVIEW",
      fileName: input.fileName.slice(0, 200),
      createdById: userId,
      items: {
        create: converted.map((c) => ({
          rowNumber: c.line,
          payload: { values: c.values } as unknown as Prisma.InputJsonValue,
          errors: c.errors,
          // Une ligne valide est pré-approuvée ; la personne peut encore la rejeter.
          status: c.errors.length === 0 ? "APPROVED" : "PENDING",
        })),
      },
    },
    select: { id: true },
  });
}

/** Lot de transcription : le document reste affiché à côté de l'éditeur. */
export async function createDocumentJob(
  scope: BankScope,
  userId: string,
  input: { source: Extract<ImportSource, "PDF" | "IMAGE">; fileName: string; storagePath: string },
) {
  assertOwnedPath(bankStoragePrefix(scope.organizationId), input.storagePath);
  return prisma.importJob.create({
    data: {
      organizationId: scope.organizationId,
      source: input.source,
      status: "IN_REVIEW",
      fileName: input.fileName.slice(0, 200),
      storagePath: input.storagePath,
      createdById: userId,
    },
    select: { id: true },
  });
}

export async function listImportJobs(scope: BankScope) {
  return prisma.importJob.findMany({
    where: { organizationId: scope.organizationId, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      source: true,
      status: true,
      fileName: true,
      createdAt: true,
      _count: { select: { items: true } },
      items: { select: { status: true, questionId: true } },
    },
  });
}

export async function getImportJob(scope: BankScope, jobId: string) {
  const job = await prisma.importJob.findFirst({
    where: jobWhere(scope, jobId),
    include: { items: { orderBy: [{ rowNumber: "asc" }, { id: "asc" }] } },
  });
  if (!job) throw new AppError("NOT_FOUND", "Import introuvable.");
  return {
    ...job,
    items: job.items.map((item) => ({
      ...item,
      values: (item.payload as ItemPayload).values,
      errors: Array.isArray(item.errors) ? (item.errors as string[]) : [],
    })),
  };
}

async function itemInScope(scope: BankScope, itemId: string) {
  const item = await prisma.importItem.findFirst({
    where: { id: itemId, job: { organizationId: scope.organizationId } },
    select: { id: true, questionId: true, errors: true, job: { select: { id: true, status: true } } },
  });
  if (!item) throw new AppError("NOT_FOUND", "Ligne introuvable.");
  if (item.job.status !== "IN_REVIEW") throw new AppError("CONFLICT", "Cet import est clôturé.");
  if (item.questionId) throw new AppError("CONFLICT", "Cette ligne a déjà été importée dans la banque.");
  return item;
}

/** Correction d'une ligne : revalidée, elle repasse à vérifier (ou approuvée si demandé et valide). */
export async function updateImportItem(scope: BankScope, itemId: string, values: unknown, approve: boolean) {
  await itemInScope(scope, itemId);
  const errors = validationErrors(values);
  await prisma.importItem.update({
    where: { id: itemId },
    data: {
      payload: { values } as unknown as Prisma.InputJsonValue,
      errors,
      status: approve && errors.length === 0 ? "APPROVED" : "PENDING",
    },
  });
  return errors;
}

/** Ajout d'une question transcrite depuis un PDF ou une image. */
export async function addImportItem(scope: BankScope, jobId: string, values: unknown, approve: boolean) {
  const job = await prisma.importJob.findFirst({ where: jobWhere(scope, jobId), select: { id: true, status: true } });
  if (!job) throw new AppError("NOT_FOUND", "Import introuvable.");
  if (job.status !== "IN_REVIEW") throw new AppError("CONFLICT", "Cet import est clôturé.");
  const errors = validationErrors(values);
  const count = await prisma.importItem.count({ where: { jobId } });
  await prisma.importItem.create({
    data: {
      jobId,
      rowNumber: count + 1,
      payload: { values } as unknown as Prisma.InputJsonValue,
      errors,
      status: approve && errors.length === 0 ? "APPROVED" : "PENDING",
    },
  });
  return errors;
}

export async function setImportItemStatus(scope: BankScope, reviewerId: string, itemId: string, status: "APPROVED" | "REJECTED" | "PENDING") {
  const item = await itemInScope(scope, itemId);
  if (status === "APPROVED" && Array.isArray(item.errors) && item.errors.length > 0) {
    throw new AppError("VALIDATION", "Corrigez les erreurs de cette ligne avant de l'approuver.");
  }
  await prisma.importItem.update({ where: { id: itemId }, data: { status, reviewedById: reviewerId, reviewedAt: new Date() } });
}

/**
 * Crée dans la banque les questions des lignes approuvées. Par défaut en
 * brouillon : la publication reste un geste explicite.
 */
export async function commitImportJob(scope: BankScope, userId: string, jobId: string, options: { publish: boolean }) {
  const job = await getImportJob(scope, jobId);
  if (job.status !== "IN_REVIEW") throw new AppError("CONFLICT", "Cet import est clôturé.");
  const ready = job.items.filter((i) => i.status === "APPROVED" && !i.questionId);
  if (ready.length === 0) throw new AppError("VALIDATION", "Aucune ligne approuvée à importer.");

  let created = 0;
  for (const item of ready) {
    const parsed = questionEditorSchema.safeParse(item.values);
    if (!parsed.success) continue; // garde-fou : une ligne devenue invalide n'est jamais importée
    const question = await createQuestion(scope, userId, toQuestionData(parsed.data), options.publish ? "PUBLISHED" : "DRAFT");
    await prisma.importItem.update({ where: { id: item.id }, data: { questionId: question.id, reviewedById: userId, reviewedAt: new Date() } });
    created++;
  }

  const remaining = await prisma.importItem.count({ where: { jobId, questionId: null, status: { not: "REJECTED" } } });
  if (remaining === 0) await prisma.importJob.update({ where: { id: jobId }, data: { status: "COMMITTED" } });
  return { created };
}

export async function cancelImportJob(scope: BankScope, jobId: string) {
  const job = await prisma.importJob.findFirst({ where: jobWhere(scope, jobId), select: { id: true, status: true } });
  if (!job) throw new AppError("NOT_FOUND", "Import introuvable.");
  if (job.status === "COMMITTED") throw new AppError("CONFLICT", "Cet import est déjà terminé.");
  await prisma.importJob.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
}
