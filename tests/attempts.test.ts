import { describe, expect, it } from "vitest";
import { finalScore, hasPassed, summarize } from "@/lib/attempts/scoring";
import { attemptDeadline, effectiveDeadline, elapsedSeconds, isPast, SAVE_GRACE_MS, sectionDeadline } from "@/lib/attempts/timing";
import { resultAccess } from "@/lib/attempts/visibility";
import { buildCorrection, describeExpected, storedGradeStatus } from "@/lib/questions/correction";

const t0 = new Date("2027-03-01T09:00:00.000Z");
const plus = (seconds: number) => new Date(t0.getTime() + seconds * 1000);

describe("échéances calculées par le serveur", () => {
  it("fixe l'échéance globale à partir de la durée", () => {
    expect(attemptDeadline(t0, 900, null)).toEqual(plus(900));
  });

  it("borne l'échéance par la clôture de la campagne", () => {
    expect(attemptDeadline(t0, 900, plus(300))).toEqual(plus(300));
    expect(attemptDeadline(t0, null, plus(300))).toEqual(plus(300));
    expect(attemptDeadline(t0, null, null)).toBeNull();
  });

  it("borne la durée d'une épreuve par l'échéance globale", () => {
    expect(sectionDeadline(t0, 600, plus(1800))).toEqual(plus(600));
    expect(sectionDeadline(t0, 600, plus(400))).toEqual(plus(400));
    expect(sectionDeadline(t0, null, null)).toBeNull();
  });

  it("retient l'échéance la plus proche", () => {
    expect(effectiveDeadline({ attemptDeadlineAt: plus(900), sectionDeadlineAt: plus(600), campaignClosesAt: null })).toEqual(plus(600));
    expect(effectiveDeadline({ attemptDeadlineAt: null, sectionDeadlineAt: null, campaignClosesAt: null })).toBeNull();
  });

  it("accorde une tolérance réseau aux enregistrements, pas au-delà", () => {
    expect(isPast(plus(0), plus(2), SAVE_GRACE_MS)).toBe(false);
    expect(isPast(plus(0), plus(4), SAVE_GRACE_MS)).toBe(true);
    expect(isPast(null, plus(99999))).toBe(false);
  });

  it("ne compte jamais plus de temps que la limite", () => {
    expect(elapsedSeconds(t0, plus(1200), plus(900))).toBe(900);
    expect(elapsedSeconds(t0, plus(300), plus(900))).toBe(300);
  });
});

describe("agrégation des scores", () => {
  it("additionne les points, plancher à zéro avec les points négatifs", () => {
    expect(
      summarize([
        { points: 1, score: -0.5, needsManualReview: false },
        { points: 1, score: 0, needsManualReview: false },
      ]),
    ).toMatchObject({ score: 0, maxScore: 2, percent: 0 });
  });

  it("calcule le pourcentage et signale une notation manuelle en attente", () => {
    const result = summarize([
      { points: 2, score: 2, needsManualReview: false },
      { points: 2, score: null, needsManualReview: true },
    ]);
    expect(result).toEqual({ score: 2, maxScore: 4, percent: 50, pendingReview: true });
  });

  it("préfère la note manuelle à la note automatique", () => {
    expect(finalScore({ autoScore: 0, manualScore: 1.5 })).toBe(1.5);
    expect(finalScore({ autoScore: 1, manualScore: null })).toBe(1);
  });

  it("exige que chaque seuil défini soit atteint", () => {
    expect(hasPassed({ percent: 70, passingPercent: 60 }, [{ percent: 40, passingPercent: 50 }])).toBe(false);
    expect(hasPassed({ percent: 70, passingPercent: 60 }, [{ percent: 55, passingPercent: 50 }])).toBe(true);
    expect(hasPassed({ percent: 70, passingPercent: null }, [{ percent: 10, passingPercent: null }])).toBeNull();
  });
});

describe("visibilité des résultats", () => {
  const campaign = (resultsVisibility: "HIDDEN" | "SCORE_ONLY" | "FULL_AFTER_SUBMIT" | "FULL_AFTER_CLOSE", status: "PUBLISHED" | "CLOSED" = "PUBLISHED", closesAt: Date | null = null) => ({
    resultsVisibility,
    status,
    closesAt,
  });

  it("donne la correction complète hors campagne (entraînement, examen blanc)", () => {
    expect(resultAccess(null)).toBe("full");
  });

  it("respecte le choix de l'organisation", () => {
    expect(resultAccess(campaign("HIDDEN"))).toBe("none");
    expect(resultAccess(campaign("SCORE_ONLY"))).toBe("score");
    expect(resultAccess(campaign("FULL_AFTER_SUBMIT"))).toBe("full");
  });

  it("garde la correction confidentielle jusqu'à la clôture", () => {
    expect(resultAccess(campaign("FULL_AFTER_CLOSE"), t0)).toBe("score");
    expect(resultAccess(campaign("FULL_AFTER_CLOSE", "CLOSED"), t0)).toBe("full");
    expect(resultAccess(campaign("FULL_AFTER_CLOSE", "PUBLISHED", plus(-1)), t0)).toBe("full");
  });
});

describe("correction affichée", () => {
  it("décrit la réponse attendue des formats sans propositions", () => {
    expect(describeExpected("NUMERIC", { value: 22.1, tolerance: 0, unit: "L" })).toBe("22,1 L");
    expect(describeExpected("NUMERIC", { value: 12.5, tolerance: 0.1 })).toBe("12,5 ± 0,1");
    expect(describeExpected("SINGLE_CHOICE", {})).toBe("");
  });

  it("liste les bonnes propositions", () => {
    const correction = buildCorrection(
      {
        type: "MULTIPLE_CHOICE",
        answerKey: { partialCredit: false },
        options: [
          { label: "A", isCorrect: true },
          { label: "B", isCorrect: false },
          { label: "C", isCorrect: true },
        ],
        explanation: "Parce que.",
        classicMethod: null,
        quickMethod: null,
        tip: null,
        commonMistakes: null,
      },
      { status: "incorrect", score: 0 },
    );
    expect(correction.correctLabels).toEqual(["A", "C"]);
  });

  it("retrouve le statut d'une réponse notée", () => {
    expect(storedGradeStatus({ response: null, isCorrect: false, score: 0, needsManualReview: false, points: 1 })).toBe("unanswered");
    expect(storedGradeStatus({ response: { text: "x" }, isCorrect: null, score: null, needsManualReview: true, points: 1 })).toBe("pending_review");
    expect(storedGradeStatus({ response: { labels: ["A"] }, isCorrect: false, score: 0.5, needsManualReview: false, points: 1 })).toBe("partial");
  });
});
