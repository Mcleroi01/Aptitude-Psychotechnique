import type { ContentStatus, Difficulty, QuestionType } from "@/generated/prisma/enums";

export const QUESTION_TYPES = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "NUMERIC",
  "TEXT",
  "FILL_BLANK",
] as const satisfies readonly QuestionType[];

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const satisfies readonly Difficulty[];

export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const satisfies readonly ContentStatus[];

export const questionTypeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Choix unique",
  MULTIPLE_CHOICE: "Choix multiples",
  TRUE_FALSE: "Vrai ou faux",
  NUMERIC: "Réponse numérique",
  TEXT: "Réponse textuelle",
  FILL_BLANK: "Texte à compléter",
};

export const questionTypeHints: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Une seule bonne réponse parmi plusieurs propositions.",
  MULTIPLE_CHOICE: "Plusieurs bonnes réponses possibles, correction totale ou partielle.",
  TRUE_FALSE: "Une affirmation à juger vraie ou fausse.",
  NUMERIC: "Un nombre à saisir, avec une tolérance éventuelle.",
  TEXT: "Une réponse libre, corrigée automatiquement ou par un correcteur.",
  FILL_BLANK: "Un texte avec des trous à remplir.",
};

export const difficultyLabels: Record<Difficulty, string> = {
  EASY: "Facile",
  MEDIUM: "Intermédiaire",
  HARD: "Difficile",
};

export const statusLabels: Record<ContentStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  ARCHIVED: "Archivée",
};

/** Marqueur d'un trou dans l'énoncé d'un texte à compléter. */
export const BLANK_MARKER = "___";
export const BLANK_PATTERN = /_{3,}/g;

export function countBlanks(prompt: string): number {
  return prompt.match(BLANK_PATTERN)?.length ?? 0;
}

/** Étiquettes des propositions : A, B, C… */
export function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}
