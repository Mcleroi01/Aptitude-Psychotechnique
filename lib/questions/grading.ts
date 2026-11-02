import type { QuestionType } from "@/generated/prisma/enums";
import { parseAnswerKey, responseSchemas } from "@/lib/questions/answer-key";

/**
 * Moteur de correction : fonctions pures, sans accès à la base, partagées par
 * l'aperçu de l'éditeur et (côté serveur uniquement) par les tentatives.
 */

export type GradableQuestion = {
  type: QuestionType;
  answerKey: unknown;
  requiresManualGrading: boolean;
  options: { label: string; isCorrect: boolean }[];
};

export type Scoring = { points: number; negativePoints?: number };

export type GradeStatus = "correct" | "partial" | "incorrect" | "unanswered" | "pending_review";

export type GradeResult = {
  status: GradeStatus;
  /** null tant qu'une notation manuelle est attendue */
  score: number | null;
  isCorrect: boolean | null;
};

const round = (value: number) => Math.round(value * 100) / 100;

/** Comparaison de textes : espaces normalisés, casse ignorée sauf demande contraire. */
export function normalizeText(value: string, caseSensitive = false): string {
  const collapsed = value.normalize("NFC").trim().replace(/\s+/g, " ");
  return caseSensitive ? collapsed : collapsed.toLocaleLowerCase("fr");
}

function matchesAny(value: string, accepted: string[], caseSensitive: boolean): boolean {
  const normalized = normalizeText(value, caseSensitive);
  return normalized.length > 0 && accepted.some((a) => normalizeText(a, caseSensitive) === normalized);
}

function allOrNothing(correct: boolean, { points, negativePoints = 0 }: Scoring): GradeResult {
  return correct
    ? { status: "correct", score: round(points), isCorrect: true }
    : { status: "incorrect", score: round(-negativePoints), isCorrect: false };
}

const UNANSWERED: GradeResult = { status: "unanswered", score: 0, isCorrect: false };

/** Une réponse vide n'est jamais pénalisée par des points négatifs. */
export function isEmptyResponse(type: QuestionType, response: unknown): boolean {
  if (response == null) return true;
  const parsed = responseSchemas[type].safeParse(response);
  if (!parsed.success) return true;
  const data = parsed.data as Record<string, unknown>;
  switch (type) {
    case "SINGLE_CHOICE":
    case "TRUE_FALSE":
      return !data.label;
    case "MULTIPLE_CHOICE":
      return (data.labels as string[]).length === 0;
    case "NUMERIC":
      return false;
    case "TEXT":
      return (data.text as string).trim() === "";
    case "FILL_BLANK":
      return (data.blanks as string[]).every((b) => b.trim() === "");
  }
}

export function gradeResponse(question: GradableQuestion, response: unknown, scoring: Scoring): GradeResult {
  const { type } = question;
  if (isEmptyResponse(type, response)) return UNANSWERED;

  switch (type) {
    case "SINGLE_CHOICE":
    case "TRUE_FALSE": {
      const { label } = responseSchemas[type].parse(response);
      const correct = question.options.find((o) => o.isCorrect)?.label;
      return allOrNothing(label === correct, scoring);
    }

    case "MULTIPLE_CHOICE": {
      const { labels } = responseSchemas.MULTIPLE_CHOICE.parse(response);
      const { partialCredit } = parseAnswerKey("MULTIPLE_CHOICE", question.answerKey);
      const expected = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.label));
      const selected = new Set(labels);
      const good = [...selected].filter((l) => expected.has(l)).length;
      const bad = selected.size - good;
      const exact = bad === 0 && good === expected.size;
      if (exact || !partialCredit) return allOrNothing(exact, scoring);
      // Crédit partiel : chaque bonne case rapporte, chaque mauvaise retire, plancher à zéro.
      const ratio = Math.max(0, (good - bad) / expected.size);
      return ratio > 0
        ? { status: "partial", score: round(scoring.points * ratio), isCorrect: false }
        : { status: "incorrect", score: 0, isCorrect: false };
    }

    case "NUMERIC": {
      const { value } = responseSchemas.NUMERIC.parse(response);
      const key = parseAnswerKey("NUMERIC", question.answerKey);
      // Marge infime pour absorber les erreurs d'arrondi des nombres décimaux.
      return allOrNothing(Math.abs(value - key.value) <= key.tolerance + 1e-9, scoring);
    }

    case "TEXT": {
      if (question.requiresManualGrading) return { status: "pending_review", score: null, isCorrect: null };
      const { text } = responseSchemas.TEXT.parse(response);
      const key = parseAnswerKey("TEXT", question.answerKey);
      return allOrNothing(matchesAny(text, key.acceptedAnswers, key.caseSensitive), scoring);
    }

    case "FILL_BLANK": {
      const { blanks } = responseSchemas.FILL_BLANK.parse(response);
      const key = parseAnswerKey("FILL_BLANK", question.answerKey);
      const good = key.blanks.filter((blank, i) => matchesAny(blanks[i] ?? "", blank.accepted, key.caseSensitive)).length;
      if (good === key.blanks.length) return allOrNothing(true, scoring);
      // Points proportionnels au nombre de trous corrects.
      return good > 0
        ? { status: "partial", score: round((scoring.points * good) / key.blanks.length), isCorrect: false }
        : allOrNothing(false, scoring);
    }
  }
}
