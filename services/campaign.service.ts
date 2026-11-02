import "server-only";
import { randomBytes } from "node:crypto";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { CampaignSettingsInput } from "@/schemas/assessment";
import { getAssessmentDetail } from "@/services/assessment.service";

/** Campagnes de recrutement : propres à une organisation. */

export async function listCampaigns(organizationId: string) {
  return prisma.campaign.findMany({
    where: { organizationId, status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      accessMode: true,
      opensAt: true,
      closesAt: true,
      assessment: { select: { title: true } },
      _count: { select: { invitations: true, attempts: true } },
    },
  });
}

export async function getCampaign(organizationId: string, id: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id, organizationId },
    include: {
      assessment: { select: { id: true, title: true, status: true, organizationId: true } },
      _count: { select: { invitations: true, attempts: true } },
    },
  });
  if (!campaign) throw new AppError("NOT_FOUND", "Campagne introuvable.");
  return campaign;
}

/** Une organisation utilise ses évaluations, ou une évaluation publiée de la plateforme. */
async function assertUsableAssessment(organizationId: string, assessmentId: string) {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      OR: [{ organizationId, status: { not: "ARCHIVED" } }, { organizationId: null, status: "PUBLISHED" }],
    },
    select: { id: true },
  });
  if (!assessment) throw new AppError("VALIDATION", "Évaluation invalide.", { assessmentId: ["Évaluation invalide"] });
}

export async function createCampaign(organizationId: string, userId: string, input: { title: string; assessmentId: string }) {
  await assertUsableAssessment(organizationId, input.assessmentId);
  return prisma.campaign.create({
    data: { organizationId, createdById: userId, title: input.title, assessmentId: input.assessmentId },
    select: { id: true },
  });
}

export async function updateCampaignSettings(organizationId: string, id: string, input: CampaignSettingsInput) {
  const campaign = await getCampaign(organizationId, id);
  if (campaign.status === "CLOSED" || campaign.status === "ARCHIVED") {
    throw new AppError("CONFLICT", "Une campagne clôturée n'est plus modifiable.");
  }
  const closesAt = input.closesAt ? new Date(input.closesAt) : null;

  if (campaign.status === "PUBLISHED") {
    // Campagne en cours : règles d'accès, visibilité et ouverture sont figées pour
    // garantir l'égalité entre candidats ; seule la clôture peut être prolongée.
    if (closesAt && closesAt <= new Date()) throw new AppError("VALIDATION", "La nouvelle clôture doit être dans le futur.");
    await prisma.campaign.update({
      where: { id },
      data: { title: input.title, description: input.description || null, closesAt },
    });
    return;
  }

  await prisma.campaign.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description || null,
      accessMode: input.accessMode,
      resultsVisibility: input.resultsVisibility,
      opensAt: input.opensAt ? new Date(input.opensAt) : null,
      closesAt,
      maxAttempts: input.maxAttempts,
    },
  });
}

export async function publishCampaign(organizationId: string, id: string) {
  const campaign = await getCampaign(organizationId, id);
  if (campaign.status !== "DRAFT") throw new AppError("CONFLICT", "Seule une campagne en brouillon peut être publiée.");
  if (campaign.closesAt && campaign.closesAt <= new Date()) {
    throw new AppError("VALIDATION", "La date de clôture est déjà passée.");
  }
  if (campaign.assessment.status !== "PUBLISHED") {
    throw new AppError("VALIDATION", "L'évaluation doit être validée (publiée) avant la campagne.");
  }
  // Revalidation complète : la banque a pu changer depuis la publication de l'évaluation.
  const detail = await getAssessmentDetail({ organizationId: campaign.assessment.organizationId }, campaign.assessment.id);
  if (detail.issues.length > 0) throw new AppError("VALIDATION", `Évaluation incomplète : ${detail.issues[0].message}`);

  await prisma.campaign.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publicToken: campaign.accessMode === "LINK" ? randomBytes(18).toString("base64url") : null,
    },
  });
}

export async function closeCampaign(organizationId: string, id: string) {
  const campaign = await getCampaign(organizationId, id);
  if (campaign.status !== "PUBLISHED") throw new AppError("CONFLICT", "Seule une campagne publiée peut être clôturée.");
  await prisma.campaign.update({ where: { id }, data: { status: "CLOSED", closesAt: new Date() } });
}

/** Brouillon jamais utilisé : suppression ; sinon archivage (résultats conservés). */
export async function deleteCampaign(organizationId: string, id: string): Promise<"deleted" | "archived"> {
  const campaign = await getCampaign(organizationId, id);
  if (campaign.status === "PUBLISHED") throw new AppError("CONFLICT", "Clôturez la campagne avant de l'archiver.");
  if (campaign.status === "DRAFT" && campaign._count.attempts === 0) {
    await prisma.campaign.delete({ where: { id } });
    return "deleted";
  }
  await prisma.campaign.update({ where: { id }, data: { status: "ARCHIVED" } });
  return "archived";
}
