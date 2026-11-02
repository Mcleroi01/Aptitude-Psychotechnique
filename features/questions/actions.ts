"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/errors";
import { bankPaths } from "@/features/questions/bank";
import { resolveBank } from "@/features/questions/resolve-bank";
import { questionSaveSchema, toQuestionData } from "@/schemas/question";
import { createCategory, deleteCategory, updateCategory } from "@/services/category.service";
import { createQuestion, deleteQuestion, setQuestionStatus, updateQuestion } from "@/services/question.service";
import { createUploadTarget } from "@/services/storage.service";

const idSchema = z.string().min(1).max(40);

export async function saveQuestionAction(
  bankRef: unknown,
  questionId: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string; versioned: boolean }>> {
  return runAction(async () => {
    const { user, scope, bank } = await resolveBank(bankRef);
    const { values, status } = questionSaveSchema.parse(input);
    const data = toQuestionData(values);

    const result = questionId
      ? await updateQuestion(scope, user.id, idSchema.parse(questionId), data, status)
      : { ...(await createQuestion(scope, user.id, data, status)), versioned: false };

    revalidatePath(bankPaths(bank).questions);
    return result;
  });
}

export async function setQuestionStatusAction(bankRef: unknown, questionId: unknown, status: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { scope, bank } = await resolveBank(bankRef);
    await setQuestionStatus(scope, idSchema.parse(questionId), z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(status));
    revalidatePath(bankPaths(bank).questions);
  });
}

export async function deleteQuestionAction(
  bankRef: unknown,
  questionId: unknown,
): Promise<ActionResult<"deleted" | "archived">> {
  return runAction(async () => {
    const { scope, bank } = await resolveBank(bankRef);
    const outcome = await deleteQuestion(scope, idSchema.parse(questionId));
    revalidatePath(bankPaths(bank).questions);
    return outcome;
  });
}

const uploadRequestSchema = z.object({
  kind: z.enum(["image", "attachment"]),
  type: z.string().max(100),
  size: z.number().int().nonnegative(),
});

/** Renvoie une URL d'envoi direct vers le stockage, après contrôle du type et de la taille. */
export async function requestUploadAction(
  bankRef: unknown,
  input: unknown,
): Promise<ActionResult<{ path: string; uploadUrl: string }>> {
  return runAction(async () => {
    const { prefix } = await resolveBank(bankRef);
    const { kind, ...file } = uploadRequestSchema.parse(input);
    return createUploadTarget(prefix, kind, file);
  });
}

const categorySchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80, "Nom trop long"),
  description: z.string().trim().max(500, "500 caractères maximum"),
});

export async function saveCategoryAction(bankRef: unknown, categoryId: string | null, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { scope, bank } = await resolveBank(bankRef);
    const data = categorySchema.parse(input);
    if (categoryId) await updateCategory(scope, idSchema.parse(categoryId), data);
    else await createCategory(scope, data);
    revalidatePath(bankPaths(bank).categories);
  });
}

export async function deleteCategoryAction(bankRef: unknown, categoryId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { scope, bank } = await resolveBank(bankRef);
    await deleteCategory(scope, idSchema.parse(categoryId));
    revalidatePath(bankPaths(bank).categories);
  });
}
