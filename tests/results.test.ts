import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { PdfReport, pdfSafe } from "@/lib/pdf/report";
import { escapeCsv, toCsv } from "@/lib/results/csv";
import { distribution, mean, median, passRate, percentOf } from "@/lib/results/stats";

describe("statistiques", () => {
  it("calcule moyenne et médiane", () => {
    expect(mean([50, 70, 90])).toBe(70);
    expect(median([90, 50, 70, 80])).toBe(75);
    expect(mean([])).toBeNull();
    expect(median([])).toBeNull();
  });

  it("calcule le taux de réussite sur les tentatives dont l'issue est connue", () => {
    expect(passRate([true, false, true, null])).toBe(66.7);
    expect(passRate([null])).toBeNull();
  });

  it("répartit les scores par tranches de 10 %, 100 % compris dans la dernière", () => {
    const buckets = distribution([0, 9.9, 10, 55, 100]);
    expect(buckets[0]).toBe(2);
    expect(buckets[1]).toBe(1);
    expect(buckets[5]).toBe(1);
    expect(buckets[9]).toBe(1);
  });

  it("protège contre un score maximal nul", () => {
    expect(percentOf(3, 0)).toBe(0);
    expect(percentOf(7.5, 12)).toBe(62.5);
  });
});

describe("export CSV", () => {
  it("utilise le point-virgule, la virgule décimale et un BOM UTF-8", () => {
    const csv = toCsv(["Nom", "Score"], [["Awa", 12.5]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Nom;Score\r\nAwa;12,5\r\n");
  });

  it("échappe guillemets, séparateurs et retours à la ligne", () => {
    expect(escapeCsv('Dupont; "Jr"')).toBe('"Dupont; ""Jr"""');
    expect(escapeCsv("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
  });

  it("neutralise les formules mais pas les nombres négatifs", () => {
    expect(escapeCsv("=HYPERLINK(\"http://x\")")).toMatch(/^"?'=/);
    expect(escapeCsv("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCsv(-0.5)).toBe("-0,5");
  });

  it("rend lisibles booléens et valeurs vides", () => {
    expect(escapeCsv(true)).toBe("Oui");
    expect(escapeCsv(null)).toBe("");
  });
});

describe("rapport PDF", () => {
  it("remplace les caractères absents des polices standard", () => {
    expect(pdfSafe("Score ≥ 50 % − 1 → ok")).toBe("Score >= 50 % - 1 ? ok");
    expect(pdfSafe("Élève, œuvre, « guillemets » …")).toBe("Élève, œuvre, « guillemets » …");
  });

  it("produit un PDF valide, paginé, avec des accents", async () => {
    const report = await PdfReport.create("Résultats - Campagne été");
    report.title("Campagne été 2027", "Organisation · Évaluation");
    report.facts([
      ["Participants", "120"],
      ["Score moyen", "62,5 %"],
    ]);
    report.heading("Tentatives");
    report.table(
      [
        { header: "Candidat", width: 4 },
        { header: "Score", width: 2, align: "right" },
      ],
      Array.from({ length: 80 }, (_, i) => [`Candidat n° ${i + 1} avec un nom très long qui doit être tronqué`, "50 %"]),
    );
    const bytes = await report.toBytes();
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBeGreaterThan(1);
    expect(parsed.getTitle()).toBe("Résultats - Campagne été");
  });
});
