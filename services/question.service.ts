import "server-only";
import type { ContentStatus, Difficulty, QuestionType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { QuestionData } from "@/schemas/question";
import { assertOwnedPath, bankStoragePrefix, removeFiles } from "@/services/storage.service";

/**
 * Banque de questions. Toute requête est filtrée par organizationId : null
 * pour la banque Aptitude, l'identifiant de l'organisation sinon. Une
 * organisation n'atteint donc jamais les questions d'une autre.
 */
export type BankScope = { organizationId: string | null };

export const QUESTIONS_PER_PAGE = 20;

export type QuestionFilters = {
  search?: string;
  type?: QuestionType;
  status?: ContentStatus;
  categoryId?: string;
  difficulty?: Difficulty;
  page?: number;
};

export async function listQuestions(scope: BankScope, filters: QuestionFilters) {
  const where: Prisma.QuestionWhereInput = {
    organizationId: scope.organizationId,
    isLatest: true,
    status: filters.status ?? { not: "ARCHIVED" },
    ...(filters.type && { type: filters.type }),
    ...(filters.difficulty && { difficulty: filters.difficulty }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.search && { prompt: { contains: filters.search, mode: "insensitive" } }),
  };
  const page = Math.max(1, filters.page ?? 1);
  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * QUESTIONS_PER_PAGE,
      take: QUESTIONS_PER_PAGE,
      select: {
        id: true,
        type: true,
        prompt: true,
        difficulty: true,
        status: true,
        version: true,
        defaultPoints: true,
        imagePath: true,
        attachmentPath: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / QUESTIONS_PER_PAGE)), questions };
}

export async function getQuestion(scope: BankScope, id: string) {
  const question = await prisma.question.findFirst({
    where: { id, organizationId: scope.organizationId },
    include: {
      options: { orderBy: { order: "asc" } },
      _count: { select: { answers: true, assessmentQuestions: true } },
    },
  });
  if (!question) throw new AppError("NOT_FOUND", "Question introuvable.");
  return question;
}

async function assertCategoryInScope(scope: BankScope, categoryId: string | null) {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, organizationId: scope.organizationId },
    select: { id: true },
  });
  if (!category) throw new AppError("VALIDATION", "Catégorie invalide.", { categoryId: ["Catégorie invalide"] });
}

async function validate(scope: BankScope, data: QuestionData) {
  await assertCategoryInScope(scope, data.categoryId);
  const prefix = bankStoragePrefix(scope.organizationId);
  assertOwnedPath(prefix, data.imagePath);
  assertOwnedPath(prefix, data.attachmentPath);
}

/** Colonnes de la table Question (les propositions sont enregistrées à part). */
function columns(data: QuestionData) {
  const { options, answerKey, ...rest } = data;
  void options;
  return { ...rest, answerKey: answerKey as Prisma.InputJsonValue };
}

export async function createQuestion(scope: BankScope, userId: string, data: QuestionData, status: ContentStatus) {
  await validate(scope, data);
  return prisma.question.create({
    data: {
      ...columns(data),
      status,
      organizationId: scope.organizationId,
      createdById: userId,
      options: { create: data.options },
    },
    select: { id: true },
  });
}

/**
 * Une question déjà répondue dans une tentative n'est jamais modifiée sur
 * place : on crée une nouvelle version, et seules les évaluations non
 * publiées sont rattachées à cette version. Les résultats passés restent exacts.
 */
export async function updateQuestion(
  scope: BankScope,
  userId: string,
  id: string,
  data: QuestionData,
  status: ContentStatus,
) {
  const current = await getQuestion(scope, id);
  if (!current.isLatest) throw new AppError("CONFLICT", "Une version plus récente de cette question existe déjà.");
  await validate(scope, data);

  if (current._count.answers === 0) {
    await prisma.$transaction([
      prisma.questionOption.deleteMany({ where: { questionId: id } }),
      prisma.question.update({
        where: { id },
        data: { ...columns(data), status, options: { create: data.options } },
      }),
    ]);
    await removeReplacedFiles(current, data);
    return { id, versioned: false };
  }

  const created = await prisma.$transaction(async (tx) => {
    await tx.question.update({ where: { id }, data: { isLatest: false } });
    const next = await tx.question.create({
      data: {
        ...columns(data),
        status,
        organizationId: scope.organizationId,
        createdById: userId,
        version: current.version + 1,
        previousVersionId: id,
        options: { create: data.options },
      },
      select: { id: true },
    });
    await tx.assessmentQuestion.updateMany({
      where: { questionId: id, section: { assessment: { status: { not: "PUBLISHED" } } } },
      data: { questionId: next.id },
    });
    return next;
  });
  return { id: created.id, versioned: true };
}

/** Les anciens fichiers ne sont supprimés que si aucune version ne les référence plus. */
async function removeReplacedFiles(
  previous: { imagePath: string | null; attachmentPath: string | null },
  next: { imagePath: string | null; attachmentPath: string | null },
) {
  if (previous.imagePath && previous.imagePath !== next.imagePath) {
    const stillUsed = await prisma.question.count({ where: { imagePath: previous.imagePath } });
    if (!stillUsed) await removeFiles("image", [previous.imagePath]);
  }
  if (previous.attachmentPath && previous.attachmentPath !== next.attachmentPath) {
    const stillUsed = await prisma.question.count({ where: { attachmentPath: previous.attachmentPath } });
    if (!stillUsed) await removeFiles("attachment", [previous.attachmentPath]);
  }
}

export async function setQuestionStatus(scope: BankScope, id: string, status: ContentStatus) {
  const question = await getQuestion(scope, id);
  if (!question.isLatest) throw new AppError("CONFLICT", "Seule la dernière version peut changer de statut.");
  await prisma.question.update({ where: { id }, data: { status } });
}

/**
 * Suppression définitive si la question n'a jamais servi ; sinon archivage,
 * pour préserver les évaluations et les résultats qui l'utilisent.
 */
export async function deleteQuestion(scope: BankScope, id: string): Promise<"deleted" | "archived"> {
  const question = await getQuestion(scope, id);
  const used = question._count.answers > 0 || question._count.assessmentQuestions > 0 || question.version > 1;
  if (used) {
    await prisma.question.update({ where: { id }, data: { status: "ARCHIVED" } });
    return "archived";
  }
  await prisma.question.delete({ where: { id } });
  await removeReplacedFiles(question, { imagePath: null, attachmentPath: null });
  return "deleted";
}
