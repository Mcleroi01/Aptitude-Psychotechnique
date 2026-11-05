import { z } from "zod";
import type { ContentStatus, SelectionMode, TimingMode } from "@/generated/prisma/enums";
import { DIFFICULTIES } from "@/lib/questions/labels";

/** Règle de tirage d'une épreuve en mode aléatoire (AssessmentSection.drawRules). */
export const drawRuleSchema = z.object({
  // Absent = « toutes » : une règle écrite sans ces champs (seed, import) reste valide.
  categoryId: z.string().max(40).nullable().default(null),
  difficulty: z.enum(DIFFICULTIES).nullable().default(null),
  count: z.number().int().min(1, "Au moins 1 question").max(200, "200 questions maximum"),
  points: z.number().positive("Barème positif attendu").max(1000),
});

export const drawRulesSchema = z.array(drawRuleSchema).max(20, "20 règles maximum");

export type DrawRule = z.infer<typeof drawRuleSchema>;

export function parseDrawRules(value: unknown): DrawRule[] {
  const parsed = drawRulesSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export type ValidationSection = {
  id: string;
  title: string;
  durationSeconds: number | null;
  passingPercent: number | null;
  selectionMode: SelectionMode;
  questions: { status: ContentStatus; isLatest: boolean; points: number }[];
  /** Règles avec le nombre de questions publiées correspondantes dans la banque */
  drawRules: (DrawRule & { available: number })[];
};

export type ValidationInput = {
  timingMode: TimingMode;
  durationSeconds: number | null;
  passingPercent: number | null;
  sections: ValidationSection[];
};

export type ValidationIssue = { sectionId?: string; message: string };

/**
 * Contrôles avant publication. Aucune valeur n'est imposée (nombre de
 * questions, durée) : on vérifie seulement la cohérence de la configuration.
 */
export function validateAssessment(input: ValidationInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const percentOk = (p: number | null) => p === null || (p >= 0 && p <= 100);

  if (input.sections.length === 0) issues.push({ message: "Ajoutez au moins une épreuve." });
  if (input.timingMode === "GLOBAL" && !(input.durationSeconds && input.durationSeconds > 0)) {
    issues.push({ message: "Indiquez la durée globale de l'évaluation." });
  }
  if (!percentOk(input.passingPercent)) issues.push({ message: "Le seuil de réussite doit être compris entre 0 et 100 %." });

  for (const section of input.sections) {
    const at = (message: string) => issues.push({ sectionId: section.id, message: `${section.title} : ${message}` });

    if (input.timingMode === "PER_SECTION" && !(section.durationSeconds && section.durationSeconds > 0)) {
      at("indiquez la durée de l'épreuve.");
    }
    if (!percentOk(section.passingPercent)) at("le seuil de réussite doit être compris entre 0 et 100 %.");

    if (section.selectionMode === "FIXED") {
      if (section.questions.length === 0) at("ajoutez au moins une question.");
      const unusable = section.questions.filter((q) => q.status !== "PUBLISHED" || !q.isLatest).length;
      if (unusable > 0) {
        at(`${unusable} question(s) non publiée(s) ou remplacée(s) par une nouvelle version : publiez-les ou retirez-les.`);
      }
    } else {
      if (section.drawRules.length === 0) at("ajoutez au moins une règle de tirage.");
      section.drawRules.forEach((rule, i) => {
        if (rule.available < rule.count) {
          at(`la règle ${i + 1} demande ${rule.count} question(s), mais seulement ${rule.available} sont publiées dans la banque.`);
        }
      });
    }
  }
  return issues;
}

/** Score maximal d'une épreuve (somme des barèmes fixes ou des tirages). */
export function sectionMaxScore(section: Pick<ValidationSection, "selectionMode" | "questions" | "drawRules">): number {
  const total =
    section.selectionMode === "FIXED"
      ? section.questions.reduce((sum, q) => sum + q.points, 0)
      : section.drawRules.reduce((sum, r) => sum + r.count * r.points, 0);
  return Math.round(total * 100) / 100;
}

export function sectionQuestionCount(section: Pick<ValidationSection, "selectionMode" | "questions" | "drawRules">): number {
  return section.selectionMode === "FIXED"
    ? section.questions.length
    : section.drawRules.reduce((sum, r) => sum + r.count, 0);
}
