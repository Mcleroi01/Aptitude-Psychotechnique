import "server-only";
import { getAppUrl } from "@/lib/app-url";
import { AppError } from "@/lib/errors";
import { escapeHtml, sendEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { safeCallbackUrl } from "@/lib/redirects";
import { siteConfig } from "@/lib/site";
import { isActionLimited, recordAction } from "@/services/rate-limit.service";
import { hashToken } from "@/services/token.service";
import { randomBytes } from "node:crypto";

/**
 * Connexion par lien e-mail : le même lien connecte un compte existant ou le
 * crée au premier clic. La réponse est identique que l'adresse soit connue ou
 * non : on ne révèle pas qui possède un compte.
 */

const TOKEN_TTL_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export async function requestLoginLink(input: { email: string; name?: string; callbackUrl?: string; ip: string }) {
  const emailKey = `login-link:${input.email}`;
  const ipKey = `login-link-ip:${input.ip}`;
  if ((await isActionLimited(emailKey, 3, HOUR_MS)) || (await isActionLimited(ipKey, 10, HOUR_MS))) {
    throw new AppError("RATE_LIMITED", "Trop de liens demandés. Réessayez dans une heure.");
  }
  await Promise.all([recordAction(emailKey), recordAction(ipKey)]);

  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { isActive: true, name: true } });
  if (existing && !existing.isActive) return; // compte désactivé : rien n'est envoyé, réponse identique

  const token = randomBytes(32).toString("base64url");
  await prisma.emailLoginToken.create({
    data: {
      email: input.email,
      name: input.name?.trim() || null,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const params = new URLSearchParams({ token });
  const callback = safeCallbackUrl(input.callbackUrl);
  if (callback !== "/espace") params.set("callbackUrl", callback);
  const link = `${getAppUrl()}/connexion/lien?${params}`;
  const greeting = existing ? `Bonjour ${existing.name},` : "Bonjour,";
  const action = existing ? "vous connecter" : "créer votre compte";

  await sendEmail({
    to: input.email,
    subject: `Votre lien de connexion — ${siteConfig.name}`,
    text: `${greeting}\n\nOuvrez ce lien pour ${action} (valable 15 minutes, utilisable une seule fois) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>Cliquez sur le lien ci-dessous pour ${action}. Il est valable 15&nbsp;minutes et ne sert qu'une fois.</p>`,
      `<p><a href="${link}">${existing ? "Me connecter" : "Créer mon compte"}</a></p>`,
      "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>",
    ].join(""),
  });
}

/** Consomme le lien et renvoie le compte (créé si nécessaire), ou null si le lien est invalide. */
export async function consumeLoginLink(token: string) {
  const record = await prisma.emailLoginToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  const { count } = await prisma.emailLoginToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
  if (count !== 1) return null;

  const now = new Date();
  // L'ouverture du lien prouve la possession de l'adresse : elle est vérifiée d'office.
  const user = await prisma.user.upsert({
    where: { email: record.email },
    update: {},
    create: {
      email: record.email,
      name: record.name ?? record.email.split("@")[0].slice(0, 80),
      platformRole: "USER",
      emailVerifiedAt: now,
    },
  });
  if (!user.isActive) return null;
  if (!user.emailVerifiedAt) await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now } });
  return user;
}
