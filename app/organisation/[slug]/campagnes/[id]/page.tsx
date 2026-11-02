import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CampaignManager } from "@/features/campaigns/components/campaign-manager";
import { getAppUrl } from "@/lib/app-url";
import { AppError } from "@/lib/errors";
import { requireOrgMember } from "@/lib/guards";
import { getCampaign } from "@/services/campaign.service";

export const metadata: Metadata = { title: "Campagne" };

export default async function CampaignPage({ params }: PageProps<"/organisation/[slug]/campagnes/[id]">) {
  const { slug, id } = await params;
  const { organization } = await requireOrgMember(slug, "campaigns:write");

  let campaign: Awaited<ReturnType<typeof getCampaign>>;
  try {
    campaign = await getCampaign(organization.id, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <>
      <Link
        href={`/organisation/${organization.slug}/campagnes`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Campagnes
      </Link>
      <div className="mt-3">
        <CampaignManager
          slug={organization.slug}
          participationUrl={campaign.publicToken ? `${getAppUrl()}/participer/${campaign.publicToken}` : null}
          campaign={{
            id: campaign.id,
            title: campaign.title,
            description: campaign.description,
            status: campaign.status,
            accessMode: campaign.accessMode,
            resultsVisibility: campaign.resultsVisibility,
            opensAt: campaign.opensAt,
            closesAt: campaign.closesAt,
            publishedAt: campaign.publishedAt,
            maxAttempts: campaign.maxAttempts,
            publicToken: campaign.publicToken,
            assessment: campaign.assessment,
            attempts: campaign._count.attempts,
            invitations: campaign._count.invitations,
          }}
        />
      </div>
    </>
  );
}
