import { describe, expect, it } from "vitest";
import { gradeResponse, type GradableQuestion } from "@/lib/questions/grading";
import { toCandidateQuestion } from "@/lib/questions/public";
import { emptyEditorValues, parseDecimal, questionEditorSchema, toEditorValues, toQuestionData } from "@/schemas/question";

const choice = (correct: string[], type: GradableQuestion["type"] = "SINGLE_CHOICE", partialCredit = false) => ({
  type,
  answerKey: type === "MULTIPLE_CHOICE" ? { partialCredit } : {},
  requiresManualGrading: false,
  options: ["A", "B", "C", "D"].map((label) => ({ label, isCorrect: correct.includes(label) })),
});

const scoring = { points: 2, negativePoints: 0.5 };

describe("correction : choix unique et vrai/faux", () => {
  it("attribue les points à la bonne réponse", () => {
    expect(gradeResponse(choice(["B"]), { label: "B" }, scoring)).toEqual({ status: "correct", score: 2, isCorrect: true });
  });

  it("applique les points négatifs à une mauvaise réponse", () => {
    expect(gradeResponse(choice(["B"]), { label: "C" }, scoring).score).toBe(-0.5);
  });

  it("ne pénalise jamais une absence de réponse", () => {
    expect(gradeResponse(choice(["B"]), null, scoring)).toEqual({ status: "unanswered", score: 0, isCorrect: false });
    expect(gradeResponse(choice(["B"]), { label: "" }, scoring).status).toBe("unanswered");
  });

  it("traite une réponse mal formée comme absente", () => {
    expect(gradeResponse(choice(["B"]), { label: 42 }, scoring).status).toBe("unanswered");
  });
});

describe("correction : choix multiples", () => {
  it("exige toutes les bonnes cases en mode tout ou rien", () => {
    const q = choice(["A", "C"], "MULTIPLE_CHOICE");
    expect(gradeResponse(q, { labels: ["C", "A"] }, scoring).status).toBe("correct");
    expect(gradeResponse(q, { labels: ["A"] }, scoring)).toEqual({ status: "incorrect", score: -0.5, isCorrect: false });
  });

  it("accorde un crédit partiel, plancher à zéro", () => {
    const q = choice(["A", "B", "C"], "MULTIPLE_CHOICE", true);
    expect(gradeResponse(q, { labels: ["A", "B"] }, { points: 3 })).toMatchObject({ status: "partial", score: 2 });
    expect(gradeResponse(q, { labels: ["A", "B", "D"] }, { points: 3 })).toMatchObject({ score: 1 });
    expect(gradeResponse(q, { labels: ["A", "D"] }, { points: 3 })).toMatchObject({ status: "incorrect", score: 0 });
  });
});

describe("correction : numérique", () => {
  const q = { type: "NUMERIC" as const, answerKey: { value: 12.5, tolerance: 0.1 }, requiresManualGrading: false, options: [] };

  it("accepte une valeur dans la tolérance", () => {
    expect(gradeResponse(q, { value: 12.6 }, scoring).status).toBe("correct");
    expect(gradeResponse(q, { value: 12.4 }, scoring).status).toBe("correct");
  });

  it("refuse une valeur hors tolérance", () => {
    expect(gradeResponse(q, { value: 12.7 }, scoring).status).toBe("incorrect");
  });

  it("compare exactement sans tolérance malgré les arrondis binaires", () => {
    const exact = { ...q, answerKey: { value: 0.3, tolerance: 0 } };
    expect(gradeResponse(exact, { value: 0.1 + 0.2 }, scoring).status).toBe("correct");
  });
});

describe("correction : texte et texte à compléter", () => {
  const text = {
    type: "TEXT" as const,
    answerKey: { acceptedAnswers: ["Kinshasa"], caseSensitive: false },
    requiresManualGrading: false,
    options: [],
  };

  it("ignore la casse et les espaces superflus", () => {
    expect(gradeResponse(text, { text: "  kinSHASA " }, scoring).status).toBe("correct");
  });

  it("respecte la casse si demandé", () => {
    const strict = { ...text, answerKey: { acceptedAnswers: ["Kinshasa"], caseSensitive: true } };
    expect(gradeResponse(strict, { text: "kinshasa" }, scoring).status).toBe("incorrect");
  });

  it("met en attente une réponse à corriger manuellement", () => {
    expect(gradeResponse({ ...text, requiresManualGrading: true }, { text: "Une analyse" }, scoring)).toEqual({
      status: "pending_review",
      score: null,
      isCorrect: null,
    });
  });

  it("note les trous proportionnellement", () => {
    const blanks = {
      type: "FILL_BLANK" as const,
      answerKey: { blanks: [{ accepted: ["4"] }, { accepted: ["8", "huit"] }], caseSensitive: false },
      requiresManualGrading: false,
      options: [],
    };
    expect(gradeResponse(blanks, { blanks: ["4", "Huit"] }, { points: 2 }).status).toBe("correct");
    expect(gradeResponse(blanks, { blanks: ["4", "9"] }, { points: 2 })).toMatchObject({ status: "partial", score: 1 });
  });
});

describe("éditeur de question", () => {
  it("lit les décimaux à la française", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal("1 000")).toBe(1000);
    expect(parseDecimal("douze")).toBeNaN();
  });

  it("exige exactement une bonne réponse en choix unique", () => {
    const values = { ...emptyEditorValues(), prompt: "Combien font 2 + 2 ?" };
    values.options = [
      { text: "3", isCorrect: true },
      { text: "4", isCorrect: true },
    ];
    expect(questionEditorSchema.safeParse(values).success).toBe(false);
  });

  it("vérifie que chaque trou a une réponse", () => {
    const values = { ...emptyEditorValues(), type: "FILL_BLANK" as const, prompt: "2 × ___ = 8", blanks: [] };
    expect(questionEditorSchema.safeParse(values).success).toBe(false);
    expect(questionEditorSchema.safeParse({ ...values, blanks: [{ accepted: "4" }] }).success).toBe(true);
  });

  it("fait l'aller-retour formulaire ↔ données sans perte", () => {
    const values = {
      ...emptyEditorValues(),
      type: "NUMERIC" as const,
      prompt: "Quel est 25 % de 50 ?",
      numericValue: "12,5",
      numericTolerance: "0,1",
      numericUnit: "kg",
    };
    const data = toQuestionData(questionEditorSchema.parse(values));
    expect(data.answerKey).toEqual({ value: 12.5, tolerance: 0.1, unit: "kg" });
    expect(toEditorValues(data)).toMatchObject({ numericValue: "12,5", numericTolerance: "0,1", numericUnit: "kg" });
  });

  it("ne transmet jamais la correction au candidat", () => {
    const data = toQuestionData(
      questionEditorSchema.parse({
        ...emptyEditorValues(),
        prompt: "Quelle est la bonne réponse ?",
        options: [
          { text: "Oui", isCorrect: true },
          { text: "Non", isCorrect: false },
        ],
      }),
    );
    const publicQuestion = toCandidateQuestion({ id: "q1", ...data });
    expect(JSON.stringify(publicQuestion)).not.toContain("isCorrect");
    expect(publicQuestion.options).toEqual([
      { label: "A", text: "Oui" },
      { label: "B", text: "Non" },
    ]);
  });
});
