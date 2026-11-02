import { z } from "zod";
import type { AnswerKey } from "@/lib/questions/answer-key";
import { CONTENT_STATUSES, countBlanks, DIFFICULTIES, optionLabel, QUESTION_TYPES } from "@/lib/questions/labels";
import type { Difficulty, QuestionType } from "@/generated/prisma/enums";

/** Nombre décimal saisi en français : « 12,5 », « 1 000 », « -3 ». NaN si invalide. */
export function parseDecimal(value: string): number {
  const cleaned = value.replace(/[\s  ]/g, "").replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

/** Liste saisie une valeur par ligne ou séparée par « ; ». */
export function splitList(value: string): string[] {
  return value
    .split(/[\n;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

const optionalText = z.string().trim().max(5000, "5 000 caractères maximum");
const MAX_OPTIONS = 10;

/**
 * Valeurs du formulaire d'édition (forme plate, commune à tous les formats).
 * Le même schéma valide côté navigateur et côté serveur ; toQuestionData()
 * produit ensuite les données enregistrées en base.
 */
export const questionEditorSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    prompt: z.string().trim().min(3, "Énoncé trop court").max(5000, "5 000 caractères maximum"),
    categoryId: z.string().max(40),
    difficulty: z.enum(DIFFICULTIES),
    defaultPoints: z.string(),
    recommendedSeconds: z.string(),
    options: z.array(z.object({ text: z.string().trim().max(500, "500 caractères maximum"), isCorrect: z.boolean() })),
    partialCredit: z.boolean(),
    trueFalseAnswer: z.enum(["true", "false"]),
    numericValue: z.string(),
    numericTolerance: z.string(),
    numericUnit: z.string().trim().max(20),
    acceptedAnswers: z.string().max(5000),
    caseSensitive: z.boolean(),
    requiresManualGrading: z.boolean(),
    blanks: z.array(z.object({ accepted: z.string().max(1000) })),
    explanation: optionalText,
    classicMethod: optionalText,
    quickMethod: optionalText,
    tip: optionalText,
    commonMistakes: optionalText,
    imagePath: z.string().max(300).nullable(),
    attachmentPath: z.string().max(300).nullable(),
    attachmentName: z.string().max(200).nullable(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

    const points = parseDecimal(v.defaultPoints);
    if (!(points > 0 && points <= 1000)) issue(["defaultPoints"], "Nombre positif attendu (ex. 1 ou 0,5)");

    if (v.recommendedSeconds.trim()) {
      const seconds = Number(v.recommendedSeconds);
      if (!Number.isInteger(seconds) || seconds < 5 || seconds > 3600) {
        issue(["recommendedSeconds"], "Entre 5 et 3 600 secondes");
      }
    }

    switch (v.type) {
      case "SINGLE_CHOICE":
      case "MULTIPLE_CHOICE": {
        if (v.options.length < 2 || v.options.length > MAX_OPTIONS) {
          issue(["options"], `Entre 2 et ${MAX_OPTIONS} propositions`);
        }
        v.options.forEach((o, i) => {
          if (!o.text) issue(["options", i, "text"], "Proposition vide");
        });
        const texts = v.options.map((o) => o.text.toLocaleLowerCase("fr")).filter(Boolean);
        if (new Set(texts).size !== texts.length) issue(["options"], "Deux propositions sont identiques");
        const correct = v.options.filter((o) => o.isCorrect).length;
        if (v.type === "SINGLE_CHOICE" && correct !== 1) issue(["options"], "Cochez exactement une bonne réponse");
        if (v.type === "MULTIPLE_CHOICE" && correct < 1) issue(["options"], "Cochez au moins une bonne réponse");
        break;
      }
      case "NUMERIC": {
        if (Number.isNaN(parseDecimal(v.numericValue))) issue(["numericValue"], "Nombre attendu (ex. 12,5)");
        if (v.numericTolerance.trim()) {
          const tolerance = parseDecimal(v.numericTolerance);
          if (Number.isNaN(tolerance) || tolerance < 0) issue(["numericTolerance"], "Nombre positif ou nul attendu");
        }
        break;
      }
      case "TEXT": {
        if (!v.requiresManualGrading && splitList(v.acceptedAnswers).length === 0) {
          issue(["acceptedAnswers"], "Indiquez au moins une réponse acceptée, ou activez la correction manuelle");
        }
        break;
      }
      case "FILL_BLANK": {
        const count = countBlanks(v.prompt);
        if (count === 0) issue(["prompt"], "Insérez au moins un trou avec « ___ » (trois tirets bas)");
        if (count !== v.blanks.length) issue(["blanks"], "Le nombre de réponses ne correspond pas aux trous");
        v.blanks.forEach((b, i) => {
          if (splitList(b.accepted).length === 0) issue(["blanks", i, "accepted"], "Réponse attendue");
        });
        break;
      }
      case "TRUE_FALSE":
        break;
    }
  });

export type QuestionEditorValues = z.infer<typeof questionEditorSchema>;

export const questionSaveSchema = z.object({
  values: questionEditorSchema,
  status: z.enum(CONTENT_STATUSES).exclude(["ARCHIVED"]),
});

export type QuestionData = {
  type: QuestionType;
  prompt: string;
  categoryId: string | null;
  difficulty: Difficulty;
  defaultPoints: number;
  recommendedSeconds: number | null;
  answerKey: AnswerKey<QuestionType>;
  requiresManualGrading: boolean;
  options: { label: string; text: string; isCorrect: boolean; order: number }[];
  explanation: string | null;
  classicMethod: string | null;
  quickMethod: string | null;
  tip: string | null;
  commonMistakes: string | null;
  imagePath: string | null;
  attachmentPath: string | null;
  attachmentName: string | null;
};

const orNull = (value: string) => value.trim() || null;

/** Convertit des valeurs validées en données à enregistrer. */
export function toQuestionData(v: QuestionEditorValues): QuestionData {
  const common = {
    type: v.type,
    prompt: v.prompt,
    categoryId: v.categoryId || null,
    difficulty: v.difficulty,
    defaultPoints: parseDecimal(v.defaultPoints),
    recommendedSeconds: v.recommendedSeconds.trim() ? Number(v.recommendedSeconds) : null,
    explanation: orNull(v.explanation),
    classicMethod: orNull(v.classicMethod),
    quickMethod: orNull(v.quickMethod),
    tip: orNull(v.tip),
    commonMistakes: orNull(v.commonMistakes),
    imagePath: v.imagePath,
    attachmentPath: v.attachmentPath,
    attachmentName: v.attachmentPath ? v.attachmentName : null,
    requiresManualGrading: false,
    options: [] as QuestionData["options"],
  };

  switch (v.type) {
    case "SINGLE_CHOICE":
      return { ...common, answerKey: {}, options: toOptions(v.options) };
    case "MULTIPLE_CHOICE":
      return { ...common, answerKey: { partialCredit: v.partialCredit }, options: toOptions(v.options) };
    case "TRUE_FALSE":
      return {
        ...common,
        answerKey: {},
        options: [
          { label: "V", text: "Vrai", isCorrect: v.trueFalseAnswer === "true", order: 0 },
          { label: "F", text: "Faux", isCorrect: v.trueFalseAnswer === "false", order: 1 },
        ],
      };
    case "NUMERIC": {
      const tolerance = v.numericTolerance.trim() ? parseDecimal(v.numericTolerance) : 0;
      const unit = v.numericUnit || undefined;
      return { ...common, answerKey: { value: parseDecimal(v.numericValue), tolerance, ...(unit && { unit }) } };
    }
    case "TEXT":
      return {
        ...common,
        requiresManualGrading: v.requiresManualGrading,
        answerKey: { acceptedAnswers: splitList(v.acceptedAnswers), caseSensitive: v.caseSensitive },
      };
    case "FILL_BLANK":
      return {
        ...common,
        answerKey: { blanks: v.blanks.map((b) => ({ accepted: splitList(b.accepted) })), caseSensitive: v.caseSensitive },
      };
  }
}

function toOptions(options: QuestionEditorValues["options"]): QuestionData["options"] {
  return options.map((o, i) => ({ label: optionLabel(i), text: o.text, isCorrect: o.isCorrect, order: i }));
}

/** Valeurs vierges du formulaire. */
export function emptyEditorValues(): QuestionEditorValues {
  return {
    type: "SINGLE_CHOICE",
    prompt: "",
    categoryId: "",
    difficulty: "MEDIUM",
    defaultPoints: "1",
    recommendedSeconds: "",
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    partialCredit: false,
    trueFalseAnswer: "true",
    numericValue: "",
    numericTolerance: "",
    numericUnit: "",
    acceptedAnswers: "",
    caseSensitive: false,
    requiresManualGrading: false,
    blanks: [],
    explanation: "",
    classicMethod: "",
    quickMethod: "",
    tip: "",
    commonMistakes: "",
    imagePath: null,
    attachmentPath: null,
    attachmentName: null,
  };
}

type StoredQuestion = Omit<QuestionData, "answerKey"> & { answerKey: unknown };

const formatDecimal = (n: number) => String(n).replace(".", ",");

/** Valeurs du formulaire à partir d'une question enregistrée. */
export function toEditorValues(q: StoredQuestion): QuestionEditorValues {
  const base = emptyEditorValues();
  const key = (q.answerKey ?? {}) as Record<string, unknown>;
  const values: QuestionEditorValues = {
    ...base,
    type: q.type,
    prompt: q.prompt,
    categoryId: q.categoryId ?? "",
    difficulty: q.difficulty,
    defaultPoints: formatDecimal(q.defaultPoints),
    recommendedSeconds: q.recommendedSeconds?.toString() ?? "",
    explanation: q.explanation ?? "",
    classicMethod: q.classicMethod ?? "",
    quickMethod: q.quickMethod ?? "",
    tip: q.tip ?? "",
    commonMistakes: q.commonMistakes ?? "",
    imagePath: q.imagePath,
    attachmentPath: q.attachmentPath,
    attachmentName: q.attachmentName,
    requiresManualGrading: q.requiresManualGrading,
    caseSensitive: Boolean(key.caseSensitive),
  };

  switch (q.type) {
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
      values.options = [...q.options].sort((a, b) => a.order - b.order).map(({ text, isCorrect }) => ({ text, isCorrect }));
      values.partialCredit = Boolean(key.partialCredit);
      break;
    case "TRUE_FALSE":
      values.trueFalseAnswer = q.options.find((o) => o.isCorrect)?.label === "F" ? "false" : "true";
      break;
    case "NUMERIC":
      values.numericValue = typeof key.value === "number" ? formatDecimal(key.value) : "";
      values.numericTolerance = typeof key.tolerance === "number" && key.tolerance > 0 ? formatDecimal(key.tolerance) : "";
      values.numericUnit = typeof key.unit === "string" ? key.unit : "";
      break;
    case "TEXT":
      values.acceptedAnswers = Array.isArray(key.acceptedAnswers) ? key.acceptedAnswers.join("\n") : "";
      break;
    case "FILL_BLANK":
      values.blanks = Array.isArray(key.blanks)
        ? (key.blanks as { accepted: string[] }[]).map((b) => ({ accepted: b.accepted.join(" ; ") }))
        : [];
      break;
  }
  return values;
}
