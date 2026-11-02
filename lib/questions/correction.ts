import type { QuestionType } from "@/generated/prisma/enums";
import type { GradeStatus } from "@/lib/questions/grading";

/**
 * Correction montrée au candidat : uniquement quand les règles le permettent
 * (entraînement, ou résultats complets autorisés par l'organisation).
 */
export type Correction = {
  status: GradeStatus;
  score: number | null;
  correctLabels: string[];
  /** Réponse attendue en clair pour les formats sans propositions */
  expected: string;
  explanation: string | null;
  classicMethod: string | null;
  quickMethod: string | null;
  tip: string | null;
  commonMistakes: string | null;
};

type Source = {
  type: QuestionType;
  answerKey: unknown;
  options: { label: string; isCorrect: boolean }[];
  explanation: string | null;
  classicMethod: string | null;
  quickMethod: string | null;
  tip: string | null;
  commonMistakes: string | null;
};

const decimal = (n: unknown) => String(n).replace(".", ",");

export function describeExpected(type: QuestionType, answerKey: unknown): string {
  const key = (answerKey ?? {}) as Record<string, unknown>;
  switch (type) {
    case "NUMERIC": {
      const tolerance = Number(key.tolerance) > 0 ? ` ± ${decimal(key.tolerance)}` : "";
      return `${decimal(key.value)}${tolerance}${key.unit ? ` ${key.unit}` : ""}`;
    }
    case "TEXT":
      return Array.isArray(key.acceptedAnswers) ? key.acceptedAnswers.join(" / ") : "";
    case "FILL_BLANK":
      return Array.isArray(key.blanks)
        ? (key.blanks as { accepted: string[] }[]).map((b, i) => `trou ${i + 1} : ${b.accepted.join(" / ")}`).join(" · ")
        : "";
    default:
      return "";
  }
}

export function buildCorrection(question: Source, grade: { status: GradeStatus; score: number | null }): Correction {
  return {
    status: grade.status,
    score: grade.score,
    correctLabels: question.options.filter((o) => o.isCorrect).map((o) => o.label),
    expected: describeExpected(question.type, question.answerKey),
    explanation: question.explanation,
    classicMethod: question.classicMethod,
    quickMethod: question.quickMethod,
    tip: question.tip,
    commonMistakes: question.commonMistakes,
  };
}

/** Statut d'une réponse déjà notée en base. */
export function storedGradeStatus(answer: {
  response: unknown;
  isCorrect: boolean | null;
  score: number | null;
  needsManualReview: boolean;
  points: number;
}): GradeStatus {
  if (answer.needsManualReview && answer.score === null) return "pending_review";
  if (answer.response == null) return "unanswered";
  if (answer.isCorrect) return "correct";
  return answer.score !== null && answer.score > 0 ? "partial" : "incorrect";
}
