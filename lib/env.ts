import "server-only";
import { z } from "zod";

/**
 * Variables d'environnement serveur, validées à la première lecture (pas au build),
 * pour qu'un oubli de configuration produise un message explicite.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ message: "DATABASE_URL doit être une URL PostgreSQL valide" }),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET doit contenir au moins 32 caractères"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
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
