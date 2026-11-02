import type { Metadata } from "next";
import { AssessmentPreviewScreen } from "@/features/assessments/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Aperçu de l'examen" };

export default async function AdminAssessmentPreviewPage({ params }: PageProps<"/admin/evaluations/[id]/apercu">) {
  await requireSuperAdmin();
  const { id } = await params;
  return <AssessmentPreviewScreen bank={{ kind: "platform" }} scope={{ organizationId: null }} id={id} />;
}
