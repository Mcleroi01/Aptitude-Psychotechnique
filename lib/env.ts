import "server-only";
import { z } from "zod";

/**
 * Variables d'environnement serveur, validées à la première lecture (pas au build),
 * pour qu'un oubli de configuration produise un message explicite.
 */
/**
 * Une variable facultative laissée à sa valeur d'exemple (`<ref>`, `remplacer-…`)
 * est traitée comme absente : la fonctionnalité concernée est désactivée au lieu
 * de bloquer toute l'application.
 */
const optionalSetting = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && (value.trim() === "" || /<[^>]+>|remplacer-par/i.test(value)) ? undefined : value),
    schema.optional(),
  );

const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ message: "DATABASE_URL doit être une URL PostgreSQL valide" }),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET doit contenir au moins 32 caractères"),
  NEXT_PUBLIC_SUPABASE_URL: optionalSetting(z.url({ message: "NEXT_PUBLIC_SUPABASE_URL doit être l'URL du projet Supabase" })),
  SUPABASE_SERVICE_ROLE_KEY: optionalSetting(z.string().min(20, "Clé service_role invalide")),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuration invalide :\n${details}\nVoir .env.example.`);
  }
  cached = parsed.data;
  return cached;
}
