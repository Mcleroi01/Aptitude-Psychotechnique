"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { resolveOwner, type AttemptOwner } from "@/lib/attempt-owner";
import { AppError, runAction, type ActionResult } from "@/lib/errors";
import { assertUser } from "@/lib/guards";
import { DIFFICULTIES } from "@/lib/questions/labels";
import type { Correction } from "@/lib/questions/correction";
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
import { clientIpFrom, isActionLimited, recordAction } from "@/services/rate-limit.service";

const id = z.string().min(1).max(40);

/** Propriétaire de la tentative en cours de manipulation (compte ou invité). */
async function owner(): Promise<AttemptOwner> {
  const resolved = await resolveOwner();
  if (!resolved) throw new AppError("NOT_FOUND", "Tentative introuvable.");
  return resolved;
}

/**
 * Démarrage d'un entraînement ou d'un examen blanc, avec ou sans compte.
 * Les visiteurs sont limités par adresse IP pour éviter de saturer la base.
 */
async function starter(): Promise<AttemptOwner> {
  const resolved = await resolveOwner({ create: true });
  if (resolved?.guestId) {
    const key = `guest-start:${clientIpFrom(await headers())}`;
    if (await isActionLimited(key, 30, 60 * 60 * 1000)) {
      throw new AppError("RATE_LIMITED", "Trop de séries démarrées depuis cette connexion. Réessayez dans une heure ou créez un compte.");
    }
    await recordAction(key);
  }
  return resolved!;
}

export async function startPracticeAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const options = z
      .object({
        categoryId: z.string().max(40).nullable(),
        difficulty: z.enum(DIFFICULTIES).nullable(),
        count: z.number().int().min(1).max(50),
      })
      .parse(input);
    const attempt = await startPractice(await starter(), options);
    redirect(`/tentative/${attempt.id}`);
  });
}

export async function startPlatformExamAction(assessmentId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const attempt = await startPlatformExam(await starter(), id.parse(assessmentId));
    redirect(`/tentative/${attempt.id}`);
  });
}

/** Les campagnes de recrutement exigent un compte : le candidat doit être identifié. */
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
  return runAction(async () => getAttemptView(id.parse(attemptId), await owner()));
}

export async function startSectionAction(attemptId: unknown): Promise<ActionResult<AttemptView>> {
  return runAction(async () => {
    const who = await owner();
    await startCurrentSection(id.parse(attemptId), who);
    return getAttemptView(id.parse(attemptId), who);
  });
}

const saveSchema = z.object({
  answerId: id,
  response: z.unknown(),
  flagged: z.boolean(),
  timeSpentMs: z.number().min(0).max(24 * 3_600_000),
});

export async function saveAnswerAction(attemptId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => saveAnswer(id.parse(attemptId), await owner(), saveSchema.parse(input)));
}

export async function submitSectionAction(attemptId: unknown): Promise<ActionResult<AttemptView>> {
  return runAction(async () => {
    const who = await owner();
    await submitCurrentSection(id.parse(attemptId), who);
    return getAttemptView(id.parse(attemptId), who);
  });
}

export async function checkPracticeAnswerAction(attemptId: unknown, answerId: unknown): Promise<ActionResult<Correction>> {
  return runAction(async () => checkPracticeAnswer(id.parse(attemptId), await owner(), id.parse(answerId)));
}
