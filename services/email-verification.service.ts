import "server-only";
import { getAppUrl } from "@/lib/app-url";
import { AppError } from "@/lib/errors";
import { escapeHtml, sendEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { isActionLimited, recordAction } from "@/services/rate-limit.service";
import { consumeToken, issueToken } from "@/services/token.service";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;

/** Lu en base (et non dans le JWT) pour refléter immédiatement une vérification. */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
  return Boolean(user?.emailVerifiedAt);
}

/** Envoie (ou renvoie) le lien de vérification, limité à 3 envois par heure. */
export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, emailVerifiedAt: true },
  });
  if (!user || user.emailVerifiedAt) return;

  const key = `verify-email:${userId}`;
  if (await isActionLimited(key, MAX_SENDS_PER_HOUR, HOUR_MS)) {
    throw new AppError("RATE_LIMITED", "Trop d'envois récents. Réessayez dans une heure.");
  }

  const token = await issueToken(userId, "EMAIL_VERIFICATION", TOKEN_TTL_MS);
  const link = `${getAppUrl()}/verification-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.email,
    subject: `Confirmez votre adresse e-mail — ${siteConfig.name}`,
    text: [
      `Bonjour ${user.name},`,
      "",
      "Confirmez votre adresse e-mail en ouvrant ce lien (valable 24 heures) :",
      link,
      "",
      "Si vous n'avez pas créé de compte, ignorez ce message.",
    ].join("\n"),
    html: [
      `<p>Bonjour ${escapeHtml(user.name)},</p>`,
      "<p>Confirmez votre adresse e-mail en cliquant sur le lien ci-dessous (valable 24&nbsp;heures) :</p>",
      `<p><a href="${link}">Confirmer mon adresse</a></p>`,
      "<p>Si vous n'avez pas créé de compte, ignorez ce message.</p>",
    ].join(""),
  });
  await recordAction(key);
}

export async function verifyEmail(token: string): Promise<boolean> {
  const userId = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!userId) return false;
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return true;
}
