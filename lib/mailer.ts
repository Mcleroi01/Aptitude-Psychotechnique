import "server-only";
import { AppError } from "@/lib/errors";
import { siteConfig } from "@/lib/site";

type Email = { to: string; subject: string; text: string; html: string };

/**
 * Envoi via l'API HTTP de Resend (pas de SDK, compatible serverless).
 * Sans RESEND_API_KEY : en développement, le message est écrit dans la console
 * du serveur ; en production, l'envoi échoue avec une erreur de configuration.
 */
export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("CONFIGURATION", "L'envoi d'e-mails n'est pas encore configuré sur la plateforme.");
    }
    console.info(`\n[mail:dev] À : ${email.to}\n[mail:dev] Objet : ${email.subject}\n${email.text}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? `${siteConfig.name} <onboarding@resend.dev>`,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!response.ok) {
    console.error("[mail] Resend a répondu", response.status, await response.text().catch(() => ""));
    throw new AppError("INTERNAL", "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques minutes.");
  }
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Échappe le texte inséré dans un gabarit HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}
