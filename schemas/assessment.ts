import { z } from "zod";
import {
  CAMPAIGN_ACCESS,
  NAVIGATION_MODES,
  RESULTS_VISIBILITY,
  SELECTION_MODES,
  TIMING_MODES,
} from "@/lib/assessments/labels";

const text = (max: number) => z.string().trim().max(max, `${max} caractères maximum`);
const title = z.string().trim().min(2, "Titre trop court").max(120, "120 caractères maximum");
/** Durée saisie en minutes (null = non renseignée). */
const minutes = z.number().int("Nombre entier de minutes").min(1, "1 minute minimum").max(1440, "24 heures maximum").nullable();
const percent = z.number().min(0, "Entre 0 et 100").max(100, "Entre 0 et 100").nullable();

export const assessmentCreateSchema = z.object({ title });

export const assessmentSettingsSchema = z
  .object({
    title,
    description: text(2000),
    instructions: text(5000),
    timingMode: z.enum(TIMING_MODES),
    durationMinutes: minutes,
    passingPercent: percent,
  })
  .refine((v) => v.timingMode !== "GLOBAL" || v.durationMinutes !== null, {
    path: ["durationMinutes"],
    message: "Durée requise en mode durée globale",
  });

export type AssessmentSettingsInput = z.infer<typeof assessmentSettingsSchema>;

export const sectionSettingsSchema = z.object({
  title,
  description: text(2000),
  instructions: text(5000),
  durationMinutes: minutes,
  passingPercent: percent,
  navigationMode: z.enum(NAVIGATION_MODES),
  allowReview: z.boolean(),
  shuffleQuestions: z.boolean(),
  selectionMode: z.enum(SELECTION_MODES),
});

export type SectionSettingsInput = z.infer<typeof sectionSettingsSchema>;

export const questionScoreSchema = z.object({
  points: z.number().positive("Barème positif attendu").max(1000),
  negativePoints: z.number().min(0, "Positif ou nul").max(1000),
});

export const campaignCreateSchema = z.object({ title, assessmentId: z.string().min(1, "Choisissez une évaluation").max(40) });

export const campaignSettingsSchema = z
  .object({
    title,
    description: text(2000),
    accessMode: z.enum(CAMPAIGN_ACCESS),
    resultsVisibility: z.enum(RESULTS_VISIBILITY),
    /** Dates ISO 8601 produites par le navigateur (fuseau du recruteur) */
    opensAt: z.iso.datetime({ offset: true }).nullable(),
    closesAt: z.iso.datetime({ offset: true }).nullable(),
    maxAttempts: z.number().int().min(1, "1 minimum").max(10, "10 maximum"),
  })
  .refine((v) => !v.opensAt || !v.closesAt || new Date(v.closesAt) > new Date(v.opensAt), {
    path: ["closesAt"],
    message: "La clôture doit suivre l'ouverture",
  });

export type CampaignSettingsInput = z.infer<typeof campaignSettingsSchema>;
