import { assertOrgPermission } from "@/lib/guards";
import { downloadResponse, errorResponse } from "@/lib/http";
import { campaignResultsCsv, campaignResultsPdf } from "@/services/report.service";
import { getCampaignResults } from "@/services/results.service";

/** Export des résultats d'une campagne : ?format=csv (tableur) ou ?format=pdf (rapport). */
export async function GET(request: Request, { params }: RouteContext<"/organisation/[slug]/campagnes/[id]/resultats/export">) {
  try {
    const { slug, id } = await params;
    const { organization } = await assertOrgPermission(slug, "results:read");
    const results = await getCampaignResults(organization.id, id);
    const format = new URL(request.url).searchParams.get("format");
    const name = `resultats-${results.campaign.title}`;
    if (format === "pdf") {
      return downloadResponse(Buffer.from(await campaignResultsPdf(results, organization.name)), name, "pdf");
    }
    return downloadResponse(campaignResultsCsv(results), name, "csv");
  } catch (error) {
    return errorResponse(error);
  }
}
