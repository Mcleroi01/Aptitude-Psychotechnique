import type { QuestionType } from "@/generated/prisma/enums";
import { countBlanks } from "@/lib/questions/labels";

/**
 * Question telle que le candidat la reçoit : ni isCorrect, ni clé de
 * correction. Toute question envoyée au navigateur pendant une tentative
 * passe obligatoirement par toCandidateQuestion().
 */
export type CandidateQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl: string | null;
  attachment: { name: string; url: string } | null;
  options: { label: string; text: string }[];
  blankCount: number;
  unit: string | null;
};

type Source = {
  id: string;
  type: QuestionType;
  prompt: string;
  answerKey: unknown;
  options: { label: string; text: string; order: number }[];
};

export function toCandidateQuestion(
  q: Source,
  media: { imageUrl?: string | null; attachment?: { name: string; url: string } | null } = {},
): CandidateQuestion {
  const key = (q.answerKey ?? {}) as { unit?: unknown };
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    imageUrl: media.imageUrl ?? null,
    attachment: media.attachment ?? null,
    options: [...q.options].sort((a, b) => a.order - b.order).map(({ label, text }) => ({ label, text })),
    blankCount: q.type === "FILL_BLANK" ? countBlanks(q.prompt) : 0,
    unit: q.type === "NUMERIC" && typeof key.unit === "string" ? key.unit : null,
  };
}
