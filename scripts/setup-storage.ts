/**
 * Crée (ou met à jour) les buckets Supabase Storage, privés, avec limites de
 * taille et types autorisés : le stockage refuse lui-même un fichier non
 * conforme, même envoyé hors de l'application. Idempotent.
 *   npm run storage:setup
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { UPLOAD_RULES } from "../lib/storage-rules";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis.");

const supabase = createClient(url, key, { auth: { persistSession: false } });

const buckets = [
  {
    id: "question-images",
    fileSizeLimit: UPLOAD_RULES.image.maxBytes,
    allowedMimeTypes: Object.keys(UPLOAD_RULES.image.types),
  },
  {
    id: "documents",
    fileSizeLimit: UPLOAD_RULES.attachment.maxBytes,
    allowedMimeTypes: Object.keys(UPLOAD_RULES.attachment.types),
  },
];

async function main() {
  const { data: existing, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  for (const bucket of buckets) {
    const options = { public: false, fileSizeLimit: bucket.fileSizeLimit, allowedMimeTypes: bucket.allowedMimeTypes };
    const result = existing.some((b) => b.id === bucket.id)
      ? await supabase.storage.updateBucket(bucket.id, options)
      : await supabase.storage.createBucket(bucket.id, options);
    if (result.error) throw result.error;
    console.log(`✔ Bucket privé « ${bucket.id} »`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
