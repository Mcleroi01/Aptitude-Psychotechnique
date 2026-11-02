import { describe, expect, it } from "vitest";
import { formatDuration, formatPoints } from "@/lib/assessments/labels";
import {
  parseDrawRules,
  sectionMaxScore,
  sectionQuestionCount,
  validateAssessment,
  type ValidationInput,
  type ValidationSection,
} from "@/lib/assessments/validation";
import { assessmentSettingsSchema, campaignSettingsSchema } from "@/schemas/assessment";

const fixed = (overrides: Partial<ValidationSection> = {}): ValidationSection => ({
  id: "s1",
  title: "Calcul",
  durationSeconds: null,
  passingPercent: null,
  selectionMode: "FIXED",
  questions: [
    { status: "PUBLISHED", isLatest: true, points: 1 },
    { status: "PUBLISHED", isLatest: true, points: 2 },
  ],
  drawRules: [],
  ...overrides,
});

const input = (overrides: Partial<ValidationInput> = {}): ValidationInput => ({
  timingMode: "NONE",
  durationSeconds: null,
  passingPercent: null,
  sections: [fixed()],
  ...overrides,
});

describe("validation d'une évaluation", () => {
  it("accepte une configuration cohérente, quel que soit le nombre de questions", () => {
    expect(validateAssessment(input())).toEqual([]);
    expect(validateAssessment(input({ sections: [fixed({ questions: [{ status: "PUBLISHED", isLatest: true, points: 1 }] })] }))).toEqual([]);
  });

  it("exige au moins une épreuve", () => {
    expect(validateAssessment(input({ sections: [] }))[0].message).toMatch(/au moins une épreuve/);
  });

  it("exige une durée globale en mode GLOBAL", () => {
    expect(validateAssessment(input({ timingMode: "GLOBAL" })).length).toBe(1);
    expect(validateAssessment(input({ timingMode: "GLOBAL", durationSeconds: 900 }))).toEqual([]);
  });

  it("exige une durée pour chaque épreuve en mode PER_SECTION", () => {
    const issues = validateAssessment(input({ timingMode: "PER_SECTION", sections: [fixed(), fixed({ id: "s2", durationSeconds: 600 })] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].sectionId).toBe("s1");
  });

  it("signale les questions non publiées ou remplacées", () => {
    const issues = validateAssessment(
      input({ sections: [fixed({ questions: [{ status: "DRAFT", isLatest: true, points: 1 }, { status: "PUBLISHED", isLatest: false, points: 1 }] })] }),
    );
    expect(issues[0].message).toMatch(/2 question/);
  });

  it("vérifie que la banque contient assez de questions pour chaque tirage", () => {
    const random = fixed({
      selectionMode: "RANDOM",
      questions: [],
      drawRules: [{ categoryId: null, difficulty: "HARD", count: 10, points: 1, available: 4 }],
    });
    expect(validateAssessment(input({ sections: [random] }))[0].message).toMatch(/demande 10 question.*seulement 4/);
  });

  it("refuse un seuil hors de 0–100 %", () => {
    expect(validateAssessment(input({ passingPercent: 120 }))).toHaveLength(1);
  });
});

describe("score maximal et nombre de questions", () => {
  it("somme les barèmes des questions choisies", () => {
    expect(sectionMaxScore(fixed())).toBe(3);
    expect(sectionQuestionCount(fixed())).toBe(2);
  });

  it("multiplie le nombre de questions tirées par leur barème", () => {
    const random = fixed({
      selectionMode: "RANDOM",
      drawRules: [
        { categoryId: null, difficulty: null, count: 10, points: 1, available: 20 },
        { categoryId: "c", difficulty: null, count: 5, points: 0.5, available: 5 },
      ],
    });
    expect(sectionMaxScore(random)).toBe(12.5);
    expect(sectionQuestionCount(random)).toBe(15);
  });

  it("ignore des règles de tirage mal formées", () => {
    expect(parseDrawRules([{ count: "dix" }])).toEqual([]);
    expect(parseDrawRules(null)).toEqual([]);
  });
});

describe("schémas", () => {
  const settings = { title: "Recrutement", description: "", instructions: "", timingMode: "GLOBAL", durationMinutes: null, passingPercent: null };

  it("exige la durée en mode global", () => {
    expect(assessmentSettingsSchema.safeParse(settings).success).toBe(false);
    expect(assessmentSettingsSchema.safeParse({ ...settings, durationMinutes: 15 }).success).toBe(true);
  });

  it("refuse une clôture antérieure à l'ouverture", () => {
    const campaign = {
      title: "Campagne",
      description: "",
      accessMode: "LINK",
      resultsVisibility: "SCORE_ONLY",
      opensAt: "2027-01-10T08:00:00.000Z",
      closesAt: "2027-01-09T08:00:00.000Z",
      maxAttempts: 1,
    };
    expect(campaignSettingsSchema.safeParse(campaign).success).toBe(false);
    expect(campaignSettingsSchema.safeParse({ ...campaign, closesAt: "2027-01-20T08:00:00.000Z" }).success).toBe(true);
  });
});

describe("formatage", () => {
  it("affiche les durées lisiblement", () => {
    expect(formatDuration(900)).toBe("15 min");
    expect(formatDuration(5400)).toBe("1 h 30");
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(null)).toBe("—");
  });

  it("affiche les points à la française", () => {
    expect(formatPoints(12.5)).toBe("12,5 pt");
  });
});
