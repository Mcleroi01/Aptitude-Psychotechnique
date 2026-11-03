import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Adresse e-mail invalide" }));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis").max(128),
});

const accountFields = {
  name: z.string().trim().min(2, "Nom trop court").max(80, "Nom trop long"),
  email: emailSchema,
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .max(128, "128 caractères maximum")
    .regex(/[A-Za-z]/, "Doit contenir au moins une lettre")
    .regex(/\d/, "Doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
};

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword,
  params: { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas" },
};

/** Demande de lien de connexion ; le nom n'est utile qu'à la création de compte. */
export const emailLinkSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(80, "Nom trop long").optional(),
});

export type EmailLinkInput = z.infer<typeof emailLinkSchema>;

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Nom trop court")
  .max(80, "Nom trop long")
  .regex(/[\p{L}\p{N}]/u, "Le nom doit contenir des lettres ou des chiffres");

export const registerSchema = z.object(accountFields).refine(passwordsMatch.check, passwordsMatch.params);

export const companyRegisterSchema = z
  .object({ organizationName: organizationNameSchema, ...accountFields })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const createOrganizationSchema = z.object({ organizationName: organizationNameSchema });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CompanyRegisterInput = z.infer<typeof companyRegisterSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
