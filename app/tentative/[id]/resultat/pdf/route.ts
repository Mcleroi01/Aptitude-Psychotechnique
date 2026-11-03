import { AppError } from "@/lib/errors";
import { resolveOwner } from "@/lib/attempt-owner";
import { downloadResponse, errorResponse } from "@/lib/http";
import { attemptResultPdf } from "@/services/report.service";
import { getAttemptResult } from "@/services/attempt-view.service";

/** Synthèse PDF pour le candidat, dans les limites de visibilité fixées par l'organisation. */
export async function GET(_request: Request, { params }: RouteContext<"/tentative/[id]/resultat/pdf">) {
  try {
    const owner = await resolveOwner();
    if (!owner) throw new AppError("NOT_FOUND", "Tentative introuvable.");
    const { id } = await params;
    const result = await getAttemptResult(id, owner);
    if (result.status === "IN_PROGRESS") throw new AppError("CONFLICT", "La tentative est encore en cours.");
    if (result.access === "none") throw new AppError("FORBIDDEN", "Les résultats de cette évaluation ne sont pas communiqués.");
    return downloadResponse(Buffer.from(await attemptResultPdf(result)), `resultats-${result.title}`, "pdf");
  } catch (error) {
    return errorResponse(error);
  }
}
