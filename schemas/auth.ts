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

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nom trop court").max(80, "Nom trop long"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .max(128, "128 caractères maximum")
      .regex(/[A-Za-z]/, "Doit contenir au moins une lettre")
      .regex(/\d/, "Doit contenir au moins un chiffre"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
