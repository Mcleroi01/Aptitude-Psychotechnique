import type { Difficulty, QuestionType } from "@/generated/prisma/enums";
import { countBlanks } from "@/lib/questions/labels";
import { emptyEditorValues, questionEditorSchema, type QuestionEditorValues } from "@/schemas/question";

/**
 * Format d'import CSV / Excel : une ligne par question, en-têtes en français.
 * Fonctions pures : conversion d'une ligne en valeurs d'éditeur, puis
 * validation par le même schéma que l'éditeur de questions.
 */

export const IMPORT_COLUMNS = [
  { key: "type", label: "type", help: "choix_unique, choix_multiples, vrai_faux, numerique, texte ou a_completer" },
  { key: "enonce", label: "enonce", help: "Énoncé. Pour un texte à compléter, chaque trou s'écrit ___ (trois tirets bas)" },
  { key: "categorie", label: "categorie", help: "Nom d'une catégorie de la banque (facultatif)" },
  { key: "difficulte", label: "difficulte", help: "facile, intermediaire ou difficile (défaut : intermediaire)" },
  { key: "points", label: "points", help: "Barème par défaut (défaut : 1)" },
  { key: "option_a", label: "option_a", help: "Propositions A à F (QCM)" },
  { key: "option_b", label: "option_b", help: "" },
  { key: "option_c", label: "option_c", help: "" },
  { key: "option_d", label: "option_d", help: "" },
  { key: "option_e", label: "option_e", help: "" },
  { key: "option_f", label: "option_f", help: "" },
  { key: "bonnes_reponses", label: "bonnes_reponses", help: "QCM : lettres séparées par ; (ex. A ou A;C). Vrai/faux : vrai ou faux" },
  { key: "valeur", label: "valeur", help: "Numérique : valeur exacte (ex. 12,5)" },
  { key: "tolerance", label: "tolerance", help: "Numérique : tolérance ± (facultatif)" },
  { key: "unite", label: "unite", help: "Numérique : unité (facultatif)" },
  { key: "reponses_acceptees", label: "reponses_acceptees", help: "Texte : variantes séparées par ;. À compléter : un groupe par trou, séparés par |" },
  { key: "correction_manuelle", label: "correction_manuelle", help: "Texte : oui pour une notation par un correcteur" },
  { key: "sensible_casse", label: "sensible_casse", help: "oui pour respecter les majuscules" },
  { key: "credit_partiel", label: "credit_partiel", help: "Choix multiples : oui pour le crédit partiel" },
  { key: "explication", label: "explication", help: "Correction rédigée (facultatif)" },
  { key: "methode_classique", label: "methode_classique", help: "" },
  { key: "methode_rapide", label: "methode_rapide", help: "" },
  { key: "astuce", label: "astuce", help: "" },
  { key: "erreurs_frequentes", label: "erreurs_frequentes", help: "" },
  { key: "temps_conseille", label: "temps_conseille", help: "Secondes (facultatif)" },
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number]["key"];
export type ImportRow = Partial<Record<ImportColumn, string>>;

export const MAX_IMPORT_ROWS = 500;

/** « Bonnes réponses » → bonnes_reponses ; accents, espaces et casse ignorés. */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const KNOWN = new Set<string>(IMPORT_COLUMNS.map((c) => c.key));

/** Tableau brut (1re ligne = en-têtes) → lignes nommées, lignes vides ignorées. */
export function tableToRows(table: unknown[][]): { rows: (ImportRow & { _line: number })[]; unknownHeaders: string[] } {
  const [header = [], ...body] = table;
  const keys = header.map((h) => normalizeHeader(String(h ?? "")));
  const unknownHeaders = keys.filter((k) => k && !KNOWN.has(k));
  const rows = body
    .map((cells, i) => {
      const row: ImportRow & { _line: number } = { _line: i + 2 };
      keys.forEach((key, j) => {
        const value = cells[j];
        if (KNOWN.has(key) && value !== null && value !== undefined && String(value).trim() !== "") {
          row[key as ImportColumn] = String(value).trim();
        }
      });
      return row;
    })
    .filter((row) => Object.keys(row).length > 1);
  return { rows, unknownHeaders };
}

const simplify = (value = "") => normalizeHeader(value);

const TYPES: Record<string, QuestionType> = {
  choix_unique: "SINGLE_CHOICE",
  qcm: "SINGLE_CHOICE",
  single_choice: "SINGLE_CHOICE",
  choix_multiples: "MULTIPLE_CHOICE",
  choix_multiple: "MULTIPLE_CHOICE",
  multiple_choice: "MULTIPLE_CHOICE",
  vrai_faux: "TRUE_FALSE",
  vrai_ou_faux: "TRUE_FALSE",
  true_false: "TRUE_FALSE",
  numerique: "NUMERIC",
  nombre: "NUMERIC",
  numeric: "NUMERIC",
  texte: "TEXT",
  reponse_texte: "TEXT",
  text: "TEXT",
  a_completer: "FILL_BLANK",
  texte_a_completer: "FILL_BLANK",
  trous: "FILL_BLANK",
  fill_blank: "FILL_BLANK",
};

const DIFFICULTY: Record<string, Difficulty> = {
  facile: "EASY",
  easy: "EASY",
  intermediaire: "MEDIUM",
  moyen: "MEDIUM",
  medium: "MEDIUM",
  difficile: "HARD",
  hard: "HARD",
};

const yes = (value?: string) => ["oui", "o", "yes", "y", "1", "vrai", "true", "x"].includes(simplify(value));

const FIELD_LABELS: Record<string, string> = {
  type: "type",
  prompt: "enonce",
  categoryId: "categorie",
  difficulty: "difficulte",
  defaultPoints: "points",
  recommendedSeconds: "temps_conseille",
  options: "options / bonnes_reponses",
  numericValue: "valeur",
  numericTolerance: "tolerance",
  acceptedAnswers: "reponses_acceptees",
  blanks: "reponses_acceptees",
};

export type ConvertedRow = { line: number; values: QuestionEditorValues; errors: string[]; categoryName: string | null };

/**
 * Convertit une ligne. `categoryIds` associe un nom de catégorie (normalisé)
 * à son identifiant ; un nom inconnu produit une erreur.
 */
export function convertRow(row: ImportRow & { _line?: number }, categoryIds: Map<string, string>): ConvertedRow {
  const errors: string[] = [];
  const values = emptyEditorValues();
  const line = row._line ?? 0;

  const type = TYPES[simplify(row.type)];
  if (!type) errors.push(row.type ? `type « ${row.type} » inconnu` : "type manquant");
  values.type = type ?? "SINGLE_CHOICE";
  values.prompt = row.enonce ?? "";

  const categoryName = row.categorie?.trim() || null;
  if (categoryName) {
    const id = categoryIds.get(simplify(categoryName));
    if (id) values.categoryId = id;
    else errors.push(`catégorie « ${categoryName} » inconnue`);
  }

  if (row.difficulte) {
    const difficulty = DIFFICULTY[simplify(row.difficulte)];
    if (difficulty) values.difficulty = difficulty;
    else errors.push(`difficulté « ${row.difficulte} » inconnue`);
  }
  if (row.points) values.defaultPoints = row.points;
  if (row.temps_conseille) values.recommendedSeconds = row.temps_conseille;
  values.caseSensitive = yes(row.sensible_casse);
  values.explanation = row.explication ?? "";
  values.classicMethod = row.methode_classique ?? "";
  values.quickMethod = row.methode_rapide ?? "";
  values.tip = row.astuce ?? "";
  values.commonMistakes = row.erreurs_frequentes ?? "";

  switch (values.type) {
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE": {
      const letters = ["a", "b", "c", "d", "e", "f"] as const;
      const texts = letters.map((l) => row[`option_${l}`]).filter((t): t is string => Boolean(t));
      const correct = new Set(
        (row.bonnes_reponses ?? "")
          .split(/[;,\s]+/)
          .map((l) => l.trim().toUpperCase())
          .filter(Boolean),
      );
      const invalid = [...correct].filter((l) => !/^[A-F]$/.test(l) || l.charCodeAt(0) - 65 >= texts.length);
      if (invalid.length) errors.push(`bonnes_reponses : ${invalid.join(", ")} ne correspond à aucune proposition`);
      values.options = texts.map((text, i) => ({ text, isCorrect: correct.has(String.fromCharCode(65 + i)) }));
      values.partialCredit = yes(row.credit_partiel);
      break;
    }
    case "TRUE_FALSE": {
      const answer = simplify(row.bonnes_reponses);
      if (["vrai", "v", "true", "oui"].includes(answer)) values.trueFalseAnswer = "true";
      else if (["faux", "f", "false", "non"].includes(answer)) values.trueFalseAnswer = "false";
      else errors.push("bonnes_reponses : indiquez vrai ou faux");
      break;
    }
    case "NUMERIC":
      values.numericValue = row.valeur ?? "";
      values.numericTolerance = row.tolerance ?? "";
      values.numericUnit = row.unite ?? "";
      break;
    case "TEXT":
      values.acceptedAnswers = (row.reponses_acceptees ?? "").split(";").map((v) => v.trim()).filter(Boolean).join("\n");
      values.requiresManualGrading = yes(row.correction_manuelle);
      break;
    case "FILL_BLANK": {
      const groups = (row.reponses_acceptees ?? "").split("|").map((g) => ({ accepted: g.trim() }));
      const blanks = countBlanks(values.prompt);
      values.blanks = groups.filter((g) => g.accepted).length ? groups : [];
      if (blanks !== values.blanks.length) {
        errors.push(`${blanks} trou(s) dans l'énoncé pour ${values.blanks.length} groupe(s) de réponses (séparés par |)`);
      }
      break;
    }
  }

  // Validation finale par le schéma de l'éditeur (mêmes règles que la saisie manuelle).
  if (type) {
    const parsed = questionEditorSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const message = `${FIELD_LABELS[String(issue.path[0])] ?? String(issue.path[0])} : ${issue.message}`;
        if (!errors.some((e) => e.includes(issue.message))) errors.push(message);
      }
    }
  }
  return { line, values, errors, categoryName };
}

/** Exemple fourni avec le modèle téléchargeable. */
export const TEMPLATE_EXAMPLES: ImportRow[] = [
  {
    type: "choix_unique",
    enonce: "Combien vaut 15 % de 240 ?",
    difficulte: "facile",
    points: "1",
    option_a: "24",
    option_b: "36",
    option_c: "40",
    option_d: "32",
    bonnes_reponses: "B",
    explication: "10 % de 240 = 24 et 5 % = 12, donc 36.",
  },
  {
    type: "numerique",
    enonce: "Une voiture consomme 6,5 L aux 100 km. Combien de litres pour 340 km ?",
    difficulte: "difficile",
    valeur: "22,1",
    unite: "L",
  },
  {
    type: "a_completer",
    enonce: "Pour multiplier par 25, on multiplie par ___ puis on divise par ___.",
    reponses_acceptees: "100;cent | 4;quatre",
  },
  { type: "vrai_faux", enonce: "Le produit de deux nombres impairs est impair.", bonnes_reponses: "vrai" },
];
