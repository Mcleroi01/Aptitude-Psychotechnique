import "server-only";
import { randomBytes } from "node:crypto";
import { getAppUrl } from "@/lib/app-url";
import { AppError } from "@/lib/errors";
import { MAX_INVITEES_PER_BATCH, type ParsedInvitee } from "@/lib/invitations";
import { escapeHtml, sendEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { isEmailVerified } from "@/services/email-verification.service";
import { recordAction } from "@/services/rate-limit.service";
import { hashToken } from "@/services/token.service";

/**
 * Invitations aux campagnes. Le lien personnel contient un jeton aléatoire
 * dont seul le hachage est stocké. Le candidat doit se connecter avec
 * l'adresse invitée : le lien seul ne suffit pas à participer.
 */

/** Plafond d'envois par organisation et par jour (protège le quota e-mail de la plateforme). */
const DAILY_SENDS_PER_ORGANIZATION = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

async function campaignInOrg(organizationId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId },
    select: { id: true, title: true, description: true, status: true, closesAt: true, organization: { select: { name: true } } },
  });
  if (!campaign) throw new AppError("NOT_FOUND", "Campagne introuvable.");
  if (campaign.status === "CLOSED" || campaign.status === "ARCHIVED") throw new AppError("CONFLICT", "Cette campagne est clôturée.");
  return campaign;
}

export async function listInvitations(organizationId: string, campaignId: string) {
  return prisma.invitation.findMany({
    where: { campaignId, campaign: { organizationId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, status: true, sentAt: true, acceptedAt: true, _count: { select: { attempts: true } } },
  });
}

/** Ajoute des candidats (sans envoi) ; une adresse déjà invitée n'est pas dupliquée. */
export async function addInvitations(organizationId: string, campaignId: string, invitees: ParsedInvitee[]) {
  await campaignInOrg(organizationId, campaignId);
  if (invitees.length === 0) throw new AppError("VALIDATION", "Aucune adresse valide.");
  if (invitees.length > MAX_INVITEES_PER_BATCH) throw new AppError("VALIDATION", `${MAX_INVITEES_PER_BATCH} candidats au maximum par ajout.`);
  const existing = new Set(
    (await prisma.invitation.findMany({ where: { campaignId, email: { in: invitees.map((i) => i.email) } }, select: { email: true } })).map((i) => i.email),
  );
  const fresh = invitees.filter((i) => !existing.has(i.email));
  await prisma.invitation.createMany({
    // Jeton provisoire : le vrai jeton est généré à l'envoi (le lien n'existe qu'à ce moment).
    data: fresh.map((i) => ({ campaignId, email: i.email, name: i.name, tokenHash: hashToken(randomBytes(32).toString("base64url")) })),
  });
  return { added: fresh.length, skipped: invitees.length - fresh.length };
}

async function deliver(
  invitation: { id: string; email: string; name: string | null },
  campaign: { title: string; description: string | null; closesAt: Date | null; organization: { name: string } },
) {
  const token = randomBytes(32).toString("base64url");
  const link = `${getAppUrl()}/invitation/${token}`;
  const greeting = invitation.name ? `Bonjour ${invitation.name},` : "Bonjour,";
  const deadline = campaign.closesAt
    ? `\nDate limite : ${campaign.closesAt.toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "long", timeStyle: "short" })} (UTC).`
    : "";
  await sendEmail({
    to: invitation.email,
    subject: `${campaign.organization.name} vous invite : ${campaign.title}`,
    text: `${greeting}\n\n${campaign.organization.name} vous invite à passer l'évaluation « ${campaign.title} » sur ${siteConfig.name}.${deadline}\n\nOuvrez ce lien puis connectez-vous (ou créez un compte) avec cette adresse e-mail :\n${link}\n\nSi vous n'attendiez pas cette invitation, ignorez ce message.`,
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p><strong>${escapeHtml(campaign.organization.name)}</strong> vous invite à passer l'évaluation « ${escapeHtml(campaign.title)} » sur ${escapeHtml(siteConfig.name)}.</p>`,
      campaign.closesAt ? `<p>${escapeHtml(deadline.trim())}</p>` : "",
      `<p><a href="${link}">Accéder à l'évaluation</a></p>`,
      "<p>Connectez-vous (ou créez un compte) avec cette adresse e-mail. Si vous n'attendiez pas cette invitation, ignorez ce message.</p>",
    ].join(""),
  });
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { tokenHash: hashToken(token), status: "SENT", sentAt: new Date() },
  });
}

/** Envoie les invitations non encore envoyées (ou une seule, pour un renvoi). */
export async function sendInvitations(organizationId: string, campaignId: string, options: { invitationId?: string } = {}) {
  const campaign = await campaignInOrg(organizationId, campaignId);
  if (campaign.status !== "PUBLISHED") throw new AppError("CONFLICT", "Publiez la campagne avant d'envoyer les invitations.");

  // Anti-abus (inscription entreprise libre) : un propriétaire à l'adresse vérifiée est requis.
  const owner = await prisma.membership.findFirst({ where: { organizationId, role: "OWNER" }, select: { userId: true } });
  if (!owner || !(await isEmailVerified(owner.userId))) {
    throw new AppError("FORBIDDEN", "Le propriétaire de l'organisation doit confirmer son adresse e-mail avant d'envoyer des invitations.");
  }

  const targets = await prisma.invitation.findMany({
    where: options.invitationId
      ? { id: options.invitationId, campaignId, status: { in: ["PENDING", "SENT"] } }
      : { campaignId, status: "PENDING" },
    select: { id: true, email: true, name: true },
    take: MAX_INVITEES_PER_BATCH,
  });
  if (targets.length === 0) throw new AppError("VALIDATION", "Aucune invitation à envoyer.");

  const key = `invitations:${organizationId}`;
  const sentToday = await prisma.loginAttempt.count({ where: { key, createdAt: { gte: new Date(Date.now() - DAY_MS) } } });
  const allowed = Math.max(0, DAILY_SENDS_PER_ORGANIZATION - sentToday);
  if (allowed === 0) {
    throw new AppError("RATE_LIMITED", `Limite de ${DAILY_SENDS_PER_ORGANIZATION} envois par jour atteinte. Réessayez demain.`);
  }

  let sent = 0;
  const failed: string[] = [];
  for (const invitation of targets.slice(0, allowed)) {
    try {
      await deliver(invitation, campaign);
      await recordAction(key);
      sent++;
    } catch (error) {
      console.error("[invitation]", error);
      failed.push(invitation.email);
      // Erreur de configuration : inutile d'insister sur les suivantes.
      if (error instanceof AppError && error.code === "CONFIGURATION") throw error;
    }
  }
  return { sent, failed, deferred: Math.max(0, targets.length - allowed) };
}

export async function revokeInvitation(organizationId: string, campaignId: string, invitationId: string) {
  const invitation = await prisma.invitation.findFirst({ where: { id: invitationId, campaignId, campaign: { organizationId } }, select: { id: true } });
  if (!invitation) throw new AppError("NOT_FOUND", "Invitation introuvable.");
  await prisma.invitation.update({ where: { id: invitationId }, data: { status: "REVOKED" } });
}

/** Invitation retrouvée par son lien (page publique). */
export async function getInvitationByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{30,60}$/.test(token)) return null;
  return prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      campaign: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          opensAt: true,
          closesAt: true,
          maxAttempts: true,
          organization: { select: { name: true, status: true } },
          assessment: { select: { timingMode: true, durationSeconds: true, sections: { orderBy: { order: "asc" }, select: { title: true, durationSeconds: true } } } },
        },
      },
    },
  });
}

/** Invitations reçues par un candidat (tableau de bord). */
export async function listUserInvitations(email: string) {
  return prisma.invitation.findMany({
    where: { email, status: { in: ["SENT", "ACCEPTED"] }, campaign: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      campaign: { select: { id: true, title: true, closesAt: true, organization: { select: { name: true } } } },
    },
  });
}
