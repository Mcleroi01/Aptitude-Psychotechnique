import { describe, expect, it } from "vitest";
import { categories } from "@/lib/content/categories";
import { answerKeySchemas } from "@/lib/questions/answer-key";
import { gradeResponse } from "@/lib/questions/grading";
import { seedQuestions, toSeedQuestionData } from "../prisma/seed-data/questions";

/** Réponse attendue construite depuis la source du seed, indépendamment des options générées. */
function expectedResponse(q: (typeof seedQuestions)[number]) {
  switch (q.type) {
    case "SINGLE_CHOICE":
      return { label: String.fromCharCode(65 + q.answer) };
    case "TRUE_FALSE":
      return { label: q.answer ? "V" : "F" };
    case "NUMERIC":
      return { value: q.value };
    case "FILL_BLANK":
      return { blanks: q.blanks.map((b) => b[0]) };
  }
}

describe("banque Aptitude initiale", () => {
  const slugs = new Set(categories.map((c) => c.slug));

  it("couvre les 8 catégories avec au moins 4 questions chacune", () => {
    for (const slug of slugs) {
      expect(seedQuestions.filter((q) => q.category === slug).length, slug).toBeGreaterThanOrEqual(4);
    }
    expect(seedQuestions.every((q) => slugs.has(q.category))).toBe(true);
  });

  it("contient assez de questions pour l'évaluation d'exemple (tirage de 15)", () => {
    expect(seedQuestions.length).toBeGreaterThanOrEqual(15);
  });

  it("n'a pas d'énoncé en double", () => {
    expect(new Set(seedQuestions.map((q) => q.prompt)).size).toBe(seedQuestions.length);
  });

  it.each(seedQuestions.map((q) => [q.prompt.slice(0, 50), q] as const))("%s : clé valide et réponse attendue correcte", (_, q) => {
    const data = toSeedQuestionData(q);
    expect(answerKeySchemas[data.type].safeParse(data.answerKey).success).toBe(true);
    if (q.type === "SINGLE_CHOICE") {
      expect(q.answer).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
    const grade = gradeResponse({ ...data, requiresManualGrading: false }, expectedResponse(q), { points: 1 });
    expect(grade.status).toBe("correct");
  });
});
