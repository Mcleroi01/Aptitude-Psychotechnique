import { describe, expect, it } from "vitest";
import { convertRow, normalizeHeader, tableToRows, TEMPLATE_EXAMPLES } from "@/lib/imports/rows";
import { toQuestionData } from "@/schemas/question";

const categories = new Map([["pourcentages", "cat-1"]]);

describe("en-têtes et lignes", () => {
  it("normalise accents, espaces et casse", () => {
    expect(normalizeHeader(" Bonnes Réponses ")).toBe("bonnes_reponses");
    expect(normalizeHeader("Énoncé")).toBe("enonce");
  });

  it("ignore les lignes vides et signale les colonnes inconnues", () => {
    const { rows, unknownHeaders } = tableToRows([
      ["Type", "Énoncé", "Colonne perso"],
      ["choix_unique", "2 + 2 ?", "x"],
      ["", "", ""],
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ _line: 2, type: "choix_unique", enonce: "2 + 2 ?" });
    expect(unknownHeaders).toEqual(["colonne_perso"]);
  });
});

describe("conversion d'une ligne", () => {
  it("accepte tous les exemples du modèle", () => {
    for (const row of TEMPLATE_EXAMPLES) {
      const result = convertRow(row, categories);
      expect(result.errors, row.enonce).toEqual([]);
    }
  });

  it("convertit un QCM avec catégorie, difficulté et barème", () => {
    const result = convertRow(
      { type: "QCM", enonce: "Combien vaut 15 % de 240 ?", categorie: "Pourcentages", difficulte: "Facile", points: "2", option_a: "24", option_b: "36", bonnes_reponses: "b" },
      categories,
    );
    expect(result.errors).toEqual([]);
    const data = toQuestionData(result.values);
    expect(data).toMatchObject({ type: "SINGLE_CHOICE", categoryId: "cat-1", difficulty: "EASY", defaultPoints: 2 });
    expect(data.options.find((o) => o.isCorrect)?.label).toBe("B");
  });

  it("signale une bonne réponse sans proposition correspondante", () => {
    const result = convertRow({ type: "choix_unique", enonce: "Question ?", option_a: "1", option_b: "2", bonnes_reponses: "D" }, categories);
    expect(result.errors.join(" ")).toMatch(/D ne correspond/);
  });

  it("signale une catégorie inconnue et un type inconnu", () => {
    expect(convertRow({ type: "choix_unique", enonce: "Question ?", categorie: "Géographie" }, categories).errors.join(" ")).toMatch(/inconnue/);
    expect(convertRow({ type: "dessin", enonce: "Question ?" }, categories).errors[0]).toMatch(/type « dessin » inconnu/);
  });

  it("vérifie la cohérence trous / réponses", () => {
    const result = convertRow({ type: "a_completer", enonce: "___ et ___", reponses_acceptees: "1" }, categories);
    expect(result.errors.join(" ")).toMatch(/2 trou\(s\).*1 groupe/);
  });

  it("gère vrai/faux, texte à correction manuelle et numérique", () => {
    expect(toQuestionData(convertRow({ type: "vrai_faux", enonce: "La Terre est ronde.", bonnes_reponses: "faux" }, categories).values).options[1].isCorrect).toBe(true);
    const text = convertRow({ type: "texte", enonce: "Expliquez votre raisonnement.", correction_manuelle: "oui" }, categories);
    expect(text.errors).toEqual([]);
    expect(text.values.requiresManualGrading).toBe(true);
    expect(convertRow({ type: "numerique", enonce: "Combien ?", valeur: "douze" }, categories).errors.join(" ")).toMatch(/valeur/);
  });
});
