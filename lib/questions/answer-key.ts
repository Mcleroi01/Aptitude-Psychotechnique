import { z } from "zod";
import type { QuestionType } from "@/generated/prisma/enums";

/**
 * Clé de correction stockée dans Question.answerKey, selon le type. Les
 * propositions (QCM, vrai/faux) portent leur propre indicateur isCorrect.
 */
export const answerKeySchemas = {
  SINGLE_CHOICE: z.object({}),
  MULTIPLE_CHOICE: z.object({ partialCredit: z.boolean() }),
  TRUE_FALSE: z.object({}),
  NUMERIC: z.object({ value: z.number(), tolerance: z.number().min(0), unit: z.string().optional() }),
  TEXT: z.object({ acceptedAnswers: z.array(z.string()), caseSensitive: z.boolean() }),
  FILL_BLANK: z.object({ blanks: z.array(z.object({ accepted: z.array(z.string()).min(1) })), caseSensitive: z.boolean() }),
} as const satisfies Record<QuestionType, z.ZodType>;

export type AnswerKey<T extends QuestionType> = z.infer<(typeof answerKeySchemas)[T]>;

export function parseAnswerKey<T extends QuestionType>(type: T, value: unknown): AnswerKey<T> {
  return answerKeySchemas[type].parse(value) as AnswerKey<T>;
}

/** Réponse d'un candidat, selon le type (étiquettes de propositions, pas d'identifiants). */
export const responseSchemas = {
  SINGLE_CHOICE: z.object({ label: z.string().max(4) }),
  MULTIPLE_CHOICE: z.object({ labels: z.array(z.string().max(4)).max(26) }),
  TRUE_FALSE: z.object({ label: z.string().max(4) }),
  NUMERIC: z.object({ value: z.number().finite() }),
  TEXT: z.object({ text: z.string().max(5000) }),
  FILL_BLANK: z.object({ blanks: z.array(z.string().max(500)).max(50) }),
} as const satisfies Record<QuestionType, z.ZodType>;

export type QuestionResponse<T extends QuestionType = QuestionType> = z.infer<(typeof responseSchemas)[T]>;
