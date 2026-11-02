import "server-only";

/** URL publique absolue de l'application (liens envoyés par e-mail). */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL ?? process.env.AUTH_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
