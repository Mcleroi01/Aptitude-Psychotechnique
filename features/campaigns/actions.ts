"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/errors";
import { assertOrgPermission } from "@/lib/guards";
import { campaignCreateSchema, campaignSettingsSchema } from "@/schemas/assessment";
import {
  closeCampaign,
  createCampaign,
  deleteCampaign,
  publishCampaign,
  updateCampaignSettings,
} from "@/services/campaign.service";

const slugSchema = z.string().min(1).max(60);
const idSchema = z.string().min(1).max(40);

async function context(slug: unknown) {
  return assertOrgPermission(slugSchema.parse(slug), "campaigns:write");
}

function refresh(slug: string, campaignId?: string) {
  revalidatePath(`/organisation/${slug}/campagnes`);
  if (campaignId) revalidatePath(`/organisation/${slug}/campagnes/${campaignId}`);
}

export async function createCampaignAction(slug: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { user, organization } = await context(slug);
    const created = await createCampaign(organization.id, user.id, campaignCreateSchema.parse(input));
    redirect(`/organisation/${organization.slug}/campagnes/${created.id}`);
  });
}

export async function updateCampaignAction(slug: unknown, campaignId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { organization } = await context(slug);
    const id = idSchema.parse(campaignId);
    await updateCampaignSettings(organization.id, id, campaignSettingsSchema.parse(input));
    refresh(organization.slug, id);
  });
}

export async function changeCampaignStatusAction(slug: unknown, campaignId: unknown, action: unknown): Promise<ActionResult<string>> {
  return runAction(async () => {
    const { organization } = await context(slug);
    const id = idSchema.parse(campaignId);
    const operation = z.enum(["publish", "close", "delete"]).parse(action);
    let outcome: string = operation;
    if (operation === "publish") await publishCampaign(organization.id, id);
    else if (operation === "close") await closeCampaign(organization.id, id);
    else outcome = await deleteCampaign(organization.id, id);
    refresh(organization.slug, id);
    return outcome;
  });
}
