import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const STORAGE_BUCKETS = {
  /** Privé : accès uniquement par URL signée générée côté serveur. */
  documents: "documents",
  /**
   * Privé : illustrations des questions. Une image peut révéler le contenu
   * d'une épreuve confidentielle, elle n'est donc servie que par URL signée.
   */
  questionImages: "question-images",
} as const;

let client: SupabaseClient | undefined;

/**
 * Client Supabase avec la clé service_role. Ne jamais l'importer dans un
 * composant client : "server-only" fait échouer le build si cela arrive.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(
      "CONFIGURATION",
      "Le stockage Supabase n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  client = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
