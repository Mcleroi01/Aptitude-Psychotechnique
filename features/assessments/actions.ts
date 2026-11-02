"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/errors";
import { drawRulesSchema } from "@/lib/assessments/validation";
import { bankPaths } from "@/features/questions/bank";
import { resolveBank } from "@/features/questions/resolve-bank";
import { assessmentCreateSchema, assessmentSettingsSchema, questionScoreSchema, sectionSettingsSchema } from "@/schemas/assessment";
import {
  addQuestionsToSection,
  addSection,
  createAssessment,
  deleteAssessment,
  deleteSection,
  duplicateAssessment,
  moveQuestionInSection,
  moveSection,
  publishAssessment,
  removeQuestionFromSection,
  searchPickerQuestions,
  setDrawRules,
  unpublishAssessment,
  updateAssessmentSettings,
  updateQuestionScore,
  updateSection,
} from "@/services/assessment.service";

const id = z.string().min(1).max(40);
const direction = z.enum(["up", "down"]);

/** Résout la banque avec le droit « évaluations », exécute l'action et rafraîchit la page. */
async function mutate<T>(bankRef: unknown, assessmentId: unknown, fn: (scope: { organizationId: string | null }) => Promise<T>) {
  const { scope, bank } = await resolveBank(bankRef, "assessments:write");
  const result = await fn(scope);
  const paths = bankPaths(bank);
  revalidatePath(paths.assessments);
  if (typeof assessmentId === "string") revalidatePath(paths.assessment(assessmentId));
  return result;
}

export async function createAssessmentAction(bankRef: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { user, scope, bank } = await resolveBank(bankRef, "assessments:write");
    const { title } = assessmentCreateSchema.parse(input);
    const created = await createAssessment(scope, user.id, title);
    redirect(bankPaths(bank).assessment(created.id));
  });
}

export async function duplicateAssessmentAction(bankRef: unknown, assessmentId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { user, scope, bank } = await resolveBank(bankRef, "assessments:write");
    const created = await duplicateAssessment(scope, user.id, id.parse(assessmentId));
    redirect(bankPaths(bank).assessment(created.id));
  });
}

export async function deleteAssessmentAction(bankRef: unknown, assessmentId: unknown): Promise<ActionResult<"deleted" | "archived">> {
  return runAction(() => mutate(bankRef, null, (scope) => deleteAssessment(scope, id.parse(assessmentId))));
}

export async function updateAssessmentSettingsAction(bankRef: unknown, assessmentId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(() =>
    mutate(bankRef, assessmentId, (scope) =>
      updateAssessmentSettings(scope, id.parse(assessmentId), assessmentSettingsSchema.parse(input)),
    ),
  );
}

export async function setAssessmentPublishedAction(bankRef: unknown, assessmentId: unknown, published: unknown): Promise<ActionResult> {
  return runAction(() =>
    mutate(bankRef, assessmentId, (scope) =>
      z.boolean().parse(published)
        ? publishAssessment(scope, id.parse(assessmentId))
        : unpublishAssessment(scope, id.parse(assessmentId)).then(() => undefined),
    ),
  );
}

export async function addSectionAction(bankRef: unknown, assessmentId: unknown): Promise<ActionResult> {
  return runAction(() => mutate(bankRef, assessmentId, (scope) => addSection(scope, id.parse(assessmentId))));
}

export async function updateSectionAction(bankRef: unknown, assessmentId: unknown, sectionId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(() =>
    mutate(bankRef, assessmentId, (scope) => updateSection(scope, id.parse(sectionId), sectionSettingsSchema.parse(input))),
  );
}

export async function deleteSectionAction(bankRef: unknown, assessmentId: unknown, sectionId: unknown): Promise<ActionResult> {
  return runAction(() => mutate(bankRef, assessmentId, (scope) => deleteSection(scope, id.parse(sectionId))));
}

export async function moveSectionAction(bankRef: unknown, assessmentId: unknown, sectionId: unknown, dir: unknown): Promise<ActionResult> {
  return runAction(() => mutate(bankRef, assessmentId, (scope) => moveSection(scope, id.parse(sectionId), direction.parse(dir))));
}

export async function setDrawRulesAction(bankRef: unknown, assessmentId: unknown, sectionId: unknown, rules: unknown): Promise<ActionResult> {
  return runAction(() =>
    mutate(bankRef, assessmentId, (scope) => setDrawRules(scope, id.parse(sectionId), drawRulesSchema.parse(rules))),
  );
}

const pickerSchema = z.object({
  search: z.string().trim().max(100).optional(),
  source: z.enum(["own", "platform"]),
  categoryId: z.string().max(40).optional(),
});

export async function searchPickerQuestionsAction(bankRef: unknown, sectionId: unknown, filters: unknown) {
  return runAction(async () => {
    const { scope } = await resolveBank(bankRef, "assessments:write");
    const parsed = pickerSchema.parse(filters);
    // Une organisation peut puiser dans la banque Aptitude ; la plateforme n'a que la sienne.
    const source = scope.organizationId ? parsed.source : "own";
    return searchPickerQuestions(scope, id.parse(sectionId), { ...parsed, source, search: parsed.search || undefined });
  });
}

export async function addQuestionsAction(bankRef: unknown, assessmentId: unknown, sectionId: unknown, questionIds: unknown): Promise<ActionResult<number>> {
  return runAction(() =>
    mutate(bankRef, assessmentId, (scope) =>
      addQuestionsToSection(scope, id.parse(sectionId), z.array(id).min(1).max(100).parse(questionIds)),
    ),
  );
}

export async function removeSectionQuestionAction(bankRef: unknown, assessmentId: unknown, itemId: unknown): Promise<ActionResult> {
  return runAction(() => mutate(bankRef, assessmentId, (scope) => removeQuestionFromSection(scope, id.parse(itemId))));
}

export async function updateQuestionScoreAction(bankRef: unknown, assessmentId: unknown, itemId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(() =>
    mutate(bankRef, assessmentId, (scope) => updateQuestionScore(scope, id.parse(itemId), questionScoreSchema.parse(input))),
  );
}

export async function moveSectionQuestionAction(bankRef: unknown, assessmentId: unknown, itemId: unknown, dir: unknown): Promise<ActionResult> {
  return runAction(() =>
    mutate(bankRef, assessmentId, (scope) => moveQuestionInSection(scope, id.parse(itemId), direction.parse(dir))),
  );
}
