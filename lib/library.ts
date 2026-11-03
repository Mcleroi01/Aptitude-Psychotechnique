import { z } from "zod";
import type { DocumentCategory, VerificationStatus } from "@/generated/prisma/enums";

export const DOCUMENT_CATEGORIES = [
  "QUESTIONNAIRE",
  "MATHS_FONDAMENTAUX",
  "PREPARATION",
  "COMMUNIQUE",
  "INFO_RECRUTEMENT",
  "INSTITUTIONNEL",
] as const satisfies readonly DocumentCategory[];

export const VERIFICATION_STATUSES = ["PLATFORM_CONTENT", "OFFICIAL_VERIFIED", "UNVERIFIED"] as const satisfies readonly VerificationStatus[];

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  QUESTIONNAIRE: "Questionnaires d'entraînement",
  MATHS_FONDAMENTAUX: "Notions de mathématiques",
  PREPARATION: "Ressources de préparation",
  COMMUNIQUE: "Communiqués de recrutement",
  INFO_RECRUTEMENT: "Informations sur le recrutement",
  INSTITUTIONNEL: "Documents institutionnels",
};

export const verificationLabels: Record<VerificationStatus, { label: string; hint: string; variant: "success" | "warning" | "sky" }> = {
  OFFICIAL_VERIFIED: {
    label: "Origine officielle vérifiée",
    hint: "La provenance a été vérifiée auprès de l'émetteur.",
    variant: "success",
  },
  UNVERIFIED: {
    label: "Origine non vérifiée",
    hint: "La provenance n'a pas pu être confirmée : ce document ne doit pas être considéré comme officiel.",
    variant: "warning",
  },
  PLATFORM_CONTENT: {
    label: "Contenu de la plateforme",
    hint: "Ressource pédagogique conçue par l'équipe de la plateforme.",
    variant: "sky",
  },
};

export const documentSchema = z
  .object({
    title: z.string().trim().min(3, "Titre trop court").max(160, "160 caractères maximum"),
    description: z.string().trim().max(2000, "2 000 caractères maximum"),
    category: z.enum(DOCUMENT_CATEGORIES),
    source: z.string().trim().min(2, "Indiquez la source (émetteur, site, auteur)").max(300),
    documentDate: z.iso.date().nullable(),
    verificationStatus: z.enum(VERIFICATION_STATUSES),
    requiresAuth: z.boolean(),
    isPublished: z.boolean(),
  })
  // Un communiqué « officiel vérifié » doit citer une source vérifiable, pas un simple nom.
  .refine((v) => v.verificationStatus !== "OFFICIAL_VERIFIED" || v.source.length >= 8, {
    path: ["source"],
    message: "Précisez la source officielle vérifiée (site, référence)",
  });

export type DocumentInput = z.infer<typeof documentSchema>;
