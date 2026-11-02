import { AppError } from "@/lib/errors";
import { assertOrgPermission } from "@/lib/guards";
import { downloadResponse, errorResponse } from "@/lib/http";
import { attemptResultPdf } from "@/services/report.service";
import { getAttemptForOrganization } from "@/services/results.service";

export async function GET(_request: Request, { params }: RouteContext<"/organisation/[slug]/campagnes/[id]/resultats/[attemptId]/pdf">) {
  try {
    const { slug, id, attemptId } = await params;
    const { organization } = await assertOrgPermission(slug, "results:read");
    const { candidate, result } = await getAttemptForOrganization(organization.id, attemptId);
    if (result.campaignId !== id) throw new AppError("NOT_FOUND", "Tentative introuvable.");
    return downloadResponse(Buffer.from(await attemptResultPdf(result, candidate)), `${result.title}-${candidate.name}`, "pdf");
  } catch (error) {
    return errorResponse(error);
  }
}
