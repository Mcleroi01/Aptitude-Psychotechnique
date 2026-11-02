import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { parseDrawRules, validateAssessment, type DrawRule, type ValidationInput } from "@/lib/assessments/validation";
import type { AssessmentSettingsInput, SectionSettingsInput } from "@/schemas/assessment";
import type { BankScope } from "@/services/question.service";

/**
 * Évaluations : une ou plusieurs épreuves, chacune avec sa durée, son barème,
 * son seuil et ses règles. Même périmètre que les banques : organizationId
 * null pour la plateforme, l'organisation sinon.
 */

const toSeconds = (minutes: number | null) => (minutes === null ? null : minutes * 60);

// ─── Lecture ─────────────────────────────────────────────────────────────────

export async function listAssessments(scope: BankScope, options: { publishedOnly?: boolean } = {}) {
  return prisma.assessment.findMany({
    where: {
      organizationId: scope.organizationId,
      status: options.publishedOnly ? "PUBLISHED" : { not: "ARCHIVED" },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      timingMode: true,
      durationSeconds: true,
      updatedAt: true,
      _count: { select: { sections: true, campaigns: true } },
    },
  });
}

/** Nombre de questions publiées de la banque correspondant à une règle de tirage. */
async function countAvailable(scope: BankScope, rule: Pick<DrawRule, "categoryId" | "difficulty">) {
  return prisma.question.count({
    where: {
      organizationId: scope.organizationId,
      status: "PUBLISHED",
      isLatest: true,
      ...(rule.categoryId && { categoryId: rule.categoryId }),
      ...(rule.difficulty && { difficulty: rule.difficulty }),
    },
  });
}

/** Une évaluation déjà utilisée (campagne publiée ou tentatives) n'est plus modifiable. */
export async function isAssessmentLocked(assessmentId: string): Promise<boolean> {
  const [campaigns, attempts] = await Promise.all([
    prisma.campaign.count({ where: { assessmentId, status: { in: ["PUBLISHED", "CLOSED"] } } }),
    prisma.assessmentAttempt.count({ where: { assessmentId } }),
  ]);
  return campaigns + attempts > 0;
}

export async function getAssessmentDetail(scope: BankScope, id: string) {
  const assessment = await prisma.assessment.findFirst({
    where: { id, organizationId: scope.organizationId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: {
              question: {
                select: {
                  id: true,
                  prompt: true,
                  type: true,
                  status: true,
                  isLatest: true,
                  difficulty: true,
                  organizationId: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
      },
      _count: { select: { campaigns: true } },
    },
  });
  if (!assessment) throw new AppError("NOT_FOUND", "Évaluation introuvable.");

  const sections = await Promise.all(
    assessment.sections.map(async (section) => ({
      ...section,
      drawRules: await Promise.all(
        parseDrawRules(section.drawRules).map(async (rule) => ({ ...rule, available: await countAvailable(scope, rule) })),
      ),
    })),
  );
  const locked = await isAssessmentLocked(id);
  const validation: ValidationInput = {
    timingMode: assessment.timingMode,
    durationSeconds: assessment.durationSeconds,
    passingPercent: assessment.passingPercent,
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      durationSeconds: s.durationSeconds,
      passingPercent: s.passingPercent,
      selectionMode: s.selectionMode,
      questions: s.questions.map((q) => ({ status: q.question.status, isLatest: q.question.isLatest, points: q.points })),
      drawRules: s.drawRules,
    })),
  };
  return { ...assessment, sections, locked, validation, issues: validateAssessment(validation) };
}

export type AssessmentDetail = Awaited<ReturnType<typeof getAssessmentDetail>>;

/** Mélange de Fisher-Yates (copie). */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Tire les questions d'une épreuve aléatoire, sans doublon entre règles.
 * Renvoie les identifiants et le barème de chaque question tirée.
 */
export async function drawSectionQuestions(scope: BankScope, rules: DrawRule[]) {
  const drawn: { questionId: string; points: number }[] = [];
  const used = new Set<string>();
  for (const rule of rules) {
    const candidates = await prisma.question.findMany({
      where: {
        organizationId: scope.organizationId,
        status: "PUBLISHED",
        isLatest: true,
        id: { notIn: [...used] },
        ...(rule.categoryId && { categoryId: rule.categoryId }),
        ...(rule.difficulty && { difficulty: rule.difficulty }),
      },
      select: { id: true },
    });
    for (const { id } of shuffle(candidates).slice(0, rule.count)) {
      used.add(id);
      drawn.push({ questionId: id, points: rule.points });
    }
  }
  return drawn;
}

/** Questions telles qu'un candidat pourrait les recevoir (tirage d'exemple pour les sections aléatoires). */
export async function buildAssessmentPreview(scope: BankScope, id: string) {
  const detail = await getAssessmentDetail(scope, id);
  const sections = await Promise.all(
    detail.sections.map(async (section) => {
      const picks =
        section.selectionMode === "FIXED"
          ? section.questions.map((q) => ({ questionId: q.question.id, points: q.points }))
          : await drawSectionQuestions(scope, section.drawRules);
      const questions = await prisma.question.findMany({
        where: { id: { in: picks.map((p) => p.questionId) } },
        select: {
          id: true,
          type: true,
          prompt: true,
          answerKey: true,
          imagePath: true,
          attachmentPath: true,
          attachmentName: true,
          options: { select: { label: true, text: true, order: true } },
        },
      });
      const byId = new Map(questions.map((q) => [q.id, q]));
      const ordered = picks.flatMap((p) => {
        const question = byId.get(p.questionId);
        return question ? [{ ...question, points: p.points }] : [];
      });
      return { section, questions: section.shuffleQuestions ? shuffle(ordered) : ordered };
    }),
  );
  return { detail, sections };
}

// ─── Évaluation ──────────────────────────────────────────────────────────────

async function findInScope(scope: BankScope, id: string) {
  const assessment = await prisma.assessment.findFirst({
    where: { id, organizationId: scope.organizationId },
    select: { id: true, status: true, title: true },
  });
  if (!assessment) throw new AppError("NOT_FOUND", "Évaluation introuvable.");
  return assessment;
}

/** Vérifie que l'évaluation est modifiable et la repasse en brouillon si elle était prête. */
async function beginEdit(scope: BankScope, id: string) {
  const assessment = await findInScope(scope, id);
  if (await isAssessmentLocked(id)) {
    throw new AppError(
      "CONFLICT",
      "Cette évaluation est utilisée par une campagne publiée ou a déjà des tentatives : dupliquez-la pour la modifier.",
    );
  }
  if (assessment.status === "PUBLISHED") {
    await prisma.assessment.update({ where: { id }, data: { status: "DRAFT" } });
  }
  return assessment;
}

export async function createAssessment(scope: BankScope, userId: string, title: string) {
  return prisma.assessment.create({
    data: {
      title,
      organizationId: scope.organizationId,
      createdById: userId,
      sections: { create: { order: 0, title: "Épreuve 1" } },
    },
    select: { id: true },
  });
}

export async function updateAssessmentSettings(scope: BankScope, id: string, input: AssessmentSettingsInput) {
  await beginEdit(scope, id);
  await prisma.assessment.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description || null,
      instructions: input.instructions || null,
      timingMode: input.timingMode,
      durationSeconds: input.timingMode === "GLOBAL" ? toSeconds(input.durationMinutes) : null,
      passingPercent: input.passingPercent,
    },
  });
}

export async function publishAssessment(scope: BankScope, id: string) {
  const detail = await getAssessmentDetail(scope, id);
  if (detail.issues.length > 0) {
    throw new AppError("VALIDATION", `L'évaluation n'est pas prête : ${detail.issues[0].message}`);
  }
  await prisma.assessment.update({ where: { id }, data: { status: "PUBLISHED" } });
}

export async function unpublishAssessment(scope: BankScope, id: string) {
  await beginEdit(scope, id);
}

/** Suppression si l'évaluation n'a jamais servi ; archivage sinon. */
export async function deleteAssessment(scope: BankScope, id: string): Promise<"deleted" | "archived"> {
  await findInScope(scope, id);
  const [campaigns, attempts] = await Promise.all([
    prisma.campaign.count({ where: { assessmentId: id } }),
    prisma.assessmentAttempt.count({ where: { assessmentId: id } }),
  ]);
  if (campaigns + attempts > 0) {
    await prisma.assessment.update({ where: { id }, data: { status: "ARCHIVED" } });
    return "archived";
  }
  await prisma.assessment.delete({ where: { id } });
  return "deleted";
}

/** Copie complète (épreuves, questions, barèmes, règles), en brouillon. */
export async function duplicateAssessment(scope: BankScope, userId: string, id: string) {
  const source = await prisma.assessment.findFirst({
    where: { id, organizationId: scope.organizationId },
    include: { sections: { include: { questions: true } } },
  });
  if (!source) throw new AppError("NOT_FOUND", "Évaluation introuvable.");

  return prisma.assessment.create({
    data: {
      organizationId: scope.organizationId,
      createdById: userId,
      title: `${source.title} (copie)`.slice(0, 120),
      description: source.description,
      instructions: source.instructions,
      timingMode: source.timingMode,
      durationSeconds: source.durationSeconds,
      passingPercent: source.passingPercent,
      sections: {
        create: source.sections.map((section) => ({
          order: section.order,
          title: section.title,
          description: section.description,
          instructions: section.instructions,
          durationSeconds: section.durationSeconds,
          passingPercent: section.passingPercent,
          navigationMode: section.navigationMode,
          allowReview: section.allowReview,
          shuffleQuestions: section.shuffleQuestions,
          selectionMode: section.selectionMode,
          drawRules: section.drawRules as Prisma.InputJsonValue,
          questions: {
            create: section.questions.map(({ questionId, order, points, negativePoints }) => ({
              questionId,
              order,
              points,
              negativePoints,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });
}

// ─── Épreuves ────────────────────────────────────────────────────────────────

async function sectionInScope(scope: BankScope, sectionId: string) {
  const section = await prisma.assessmentSection.findFirst({
    where: { id: sectionId, assessment: { organizationId: scope.organizationId } },
    select: { id: true, assessmentId: true, order: true },
  });
  if (!section) throw new AppError("NOT_FOUND", "Épreuve introuvable.");
  await beginEdit(scope, section.assessmentId);
  return section;
}

export async function addSection(scope: BankScope, assessmentId: string) {
  await beginEdit(scope, assessmentId);
  const last = await prisma.assessmentSection.aggregate({ where: { assessmentId }, _max: { order: true }, _count: true });
  await prisma.assessmentSection.create({
    data: { assessmentId, order: (last._max.order ?? -1) + 1, title: `Épreuve ${last._count + 1}` },
  });
}

export async function updateSection(scope: BankScope, sectionId: string, input: SectionSettingsInput) {
  await sectionInScope(scope, sectionId);
  await prisma.assessmentSection.update({
    where: { id: sectionId },
    data: {
      title: input.title,
      description: input.description || null,
      instructions: input.instructions || null,
      durationSeconds: toSeconds(input.durationMinutes),
      passingPercent: input.passingPercent,
      navigationMode: input.navigationMode,
      // Sans retour en arrière, la relecture finale n'a pas de sens.
      allowReview: input.navigationMode === "FREE" && input.allowReview,
      shuffleQuestions: input.shuffleQuestions,
      selectionMode: input.selectionMode,
    },
  });
}

export async function deleteSection(scope: BankScope, sectionId: string) {
  const section = await sectionInScope(scope, sectionId);
  const remaining = await prisma.assessmentSection.count({ where: { assessmentId: section.assessmentId } });
  if (remaining <= 1) throw new AppError("CONFLICT", "Une évaluation doit conserver au moins une épreuve.");
  await prisma.assessmentSection.delete({ where: { id: sectionId } });
}

export async function moveSection(scope: BankScope, sectionId: string, direction: "up" | "down") {
  const section = await sectionInScope(scope, sectionId);
  const neighbor = await prisma.assessmentSection.findFirst({
    where: {
      assessmentId: section.assessmentId,
      order: direction === "up" ? { lt: section.order } : { gt: section.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.assessmentSection.update({ where: { id: section.id }, data: { order: neighbor.order } }),
    prisma.assessmentSection.update({ where: { id: neighbor.id }, data: { order: section.order } }),
  ]);
}

export async function setDrawRules(scope: BankScope, sectionId: string, rules: DrawRule[]) {
  await sectionInScope(scope, sectionId);
  const categoryIds = [...new Set(rules.map((r) => r.categoryId).filter((c): c is string => Boolean(c)))];
  if (categoryIds.length) {
    const found = await prisma.category.count({ where: { id: { in: categoryIds }, organizationId: scope.organizationId } });
    if (found !== categoryIds.length) throw new AppError("VALIDATION", "Catégorie invalide dans une règle de tirage.");
  }
  await prisma.assessmentSection.update({ where: { id: sectionId }, data: { drawRules: rules } });
}

// ─── Questions d'une épreuve ─────────────────────────────────────────────────

/**
 * Questions utilisables : celles de la banque de l'évaluation et, pour une
 * organisation, les questions publiées de la banque Aptitude.
 */
function usableQuestionsWhere(scope: BankScope): Prisma.QuestionWhereInput {
  return scope.organizationId
    ? { isLatest: true, OR: [{ organizationId: scope.organizationId, status: { not: "ARCHIVED" } }, { organizationId: null, status: "PUBLISHED" }] }
    : { isLatest: true, organizationId: null, status: { not: "ARCHIVED" } };
}

export async function searchPickerQuestions(
  scope: BankScope,
  sectionId: string,
  filters: { search?: string; source: "own" | "platform"; categoryId?: string },
) {
  const inSection = new Set(
    (await prisma.assessmentQuestion.findMany({ where: { sectionId }, select: { questionId: true } })).map((q) => q.questionId),
  );
  const source = filters.source === "platform" ? null : scope.organizationId;
  const questions = await prisma.question.findMany({
    where: {
      AND: [
        usableQuestionsWhere(scope),
        { organizationId: source },
        filters.search ? { prompt: { contains: filters.search, mode: "insensitive" } } : {},
        filters.categoryId ? { categoryId: filters.categoryId } : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: {
      id: true,
      prompt: true,
      type: true,
      difficulty: true,
      status: true,
      defaultPoints: true,
      category: { select: { name: true } },
    },
  });
  return questions.map((q) => ({ ...q, inSection: inSection.has(q.id) }));
}

export async function addQuestionsToSection(scope: BankScope, sectionId: string, questionIds: string[]) {
  await sectionInScope(scope, sectionId);
  const questions = await prisma.question.findMany({
    where: { AND: [usableQuestionsWhere(scope), { id: { in: questionIds } }] },
    select: { id: true, defaultPoints: true },
  });
  if (questions.length !== new Set(questionIds).size) {
    throw new AppError("FORBIDDEN", "Certaines questions ne sont pas disponibles pour cette évaluation.");
  }
  const existing = await prisma.assessmentQuestion.findMany({ where: { sectionId }, select: { questionId: true, order: true } });
  const already = new Set(existing.map((e) => e.questionId));
  let order = existing.reduce((max, e) => Math.max(max, e.order), -1);
  const toAdd = questions.filter((q) => !already.has(q.id));
  await prisma.assessmentQuestion.createMany({
    data: toAdd.map((q) => ({ sectionId, questionId: q.id, order: ++order, points: q.defaultPoints })),
  });
  return toAdd.length;
}

async function assessmentQuestionInScope(scope: BankScope, id: string) {
  const item = await prisma.assessmentQuestion.findFirst({
    where: { id, section: { assessment: { organizationId: scope.organizationId } } },
    select: { id: true, sectionId: true, order: true, section: { select: { assessmentId: true } } },
  });
  if (!item) throw new AppError("NOT_FOUND", "Question introuvable dans cette épreuve.");
  await beginEdit(scope, item.section.assessmentId);
  return item;
}

export async function removeQuestionFromSection(scope: BankScope, id: string) {
  await assessmentQuestionInScope(scope, id);
  await prisma.assessmentQuestion.delete({ where: { id } });
}

export async function updateQuestionScore(scope: BankScope, id: string, score: { points: number; negativePoints: number }) {
  await assessmentQuestionInScope(scope, id);
  await prisma.assessmentQuestion.update({ where: { id }, data: score });
}

export async function moveQuestionInSection(scope: BankScope, id: string, direction: "up" | "down") {
  const item = await assessmentQuestionInScope(scope, id);
  const neighbor = await prisma.assessmentQuestion.findFirst({
    where: { sectionId: item.sectionId, order: direction === "up" ? { lt: item.order } : { gt: item.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.assessmentQuestion.update({ where: { id: item.id }, data: { order: neighbor.order } }),
    prisma.assessmentQuestion.update({ where: { id: neighbor.id }, data: { order: item.order } }),
  ]);
}
