import { getSessionUser } from "@/lib/guards";
import { errorResponse } from "@/lib/http";
import { documentDownloadUrl } from "@/services/document.service";

/** Redirige vers une URL signée de quelques minutes : le fichier reste privé. */
export async function GET(_request: Request, { params }: RouteContext<"/bibliotheque/[id]/telecharger">) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const url = await documentDownloadUrl(id, Boolean(user));
    return Response.redirect(url, 302);
  } catch (error) {
    return errorResponse(error);
  }
}
