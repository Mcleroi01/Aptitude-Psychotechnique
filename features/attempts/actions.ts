"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { DIFFICULTIES } from "@/lib/questions/labels";
import { runAction, type ActionResult } from "@/lib/errors";
import { assertUser } from "@/lib/guards";
import {
  checkPracticeAnswer,
  saveAnswer,
  startCampaignAttempt,
  startCurrentSection,
  startPlatformExam,
  startPractice,
  submitCurrentSection,
} from "@/services/attempt.service";
import { getAttemptView, type AttemptView } from "@/services/attempt-view.service";
import type { Correction } from "@/lib/questions/correction";

const id = z.string().min(1).max(40);

export async function startPracticeAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await assertUser();
    const options = z
      .object({
        categoryId: z.string().max(40).nullable(),
        difficulty: z.enum(DIFFICULTIES).nullable(),
        count: z.number().int().min(1).max(50),
      })
      .parse(input);
    const attempt = await startPractice(user.id, options);
    redirect(`/tentative/${attempt.id}`);
  });
}

export async function startPlatformExamAction(assessmentId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await assertUser();
    const attempt = await startPlatformExam(user.id, id.parse(assessmentId));
    redirect(`/tentative/${attempt.id}`);
  });
}

export async function startCampaignAttemptAction(campaignId: unknown, publicToken: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await assertUser();
    const token = z.string().max(64).optional().parse(publicToken ?? undefined);
    const attempt = await startCampaignAttempt(user, id.parse(campaignId), token);
    redirect(`/tentative/${attempt.id}`);
  });
}

/** Chaque action renvoie l'état à jour : le navigateur se recale sur l'horloge du serveur. */
export async function getAttemptViewAction(attemptId: unknown): Promise<ActionResult<AttemptView>> {
  return runAction(async () => {
    const user = await assertUser();
    return getAttemptView(id.parse(attemptId), user.id);
  });
}

export async function startSectionAction(attemptId: unknown): Promise<ActionResult<AttemptView>> {
  return runAction(async () => {
    const user = await assertUser();
    await startCurrentSection(id.parse(attemptId), user.id);
    return getAttemptView(id.parse(attemptId), user.id);
  });
}

const saveSchema = z.object({
  answerId: id,
  response: z.unknown(),
  flagged: z.boolean(),
  timeSpentMs: z.number().min(0).max(24 * 3_600_000),
});

export async function saveAnswerAction(attemptId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await assertUser();
    await saveAnswer(id.parse(attemptId), user.id, saveSchema.parse(input));
  });
}

export async function submitSectionAction(attemptId: unknown): Promise<ActionResult<AttemptView>> {
  return runAction(async () => {
    const user = await assertUser();
    await submitCurrentSection(id.parse(attemptId), user.id);
    return getAttemptView(id.parse(attemptId), user.id);
  });
}

export async function checkPracticeAnswerAction(attemptId: unknown, answerId: unknown): Promise<ActionResult<Correction>> {
  return runAction(async () => {
    const user = await assertUser();
    return checkPracticeAnswer(id.parse(attemptId), user.id, id.parse(answerId));
  });
}
