import type { Metadata } from "next";
import { AssessmentBuilderScreen } from "@/features/assessments/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Évaluation" };

export default async function AdminAssessmentPage({ params }: PageProps<"/admin/evaluations/[id]">) {
  await requireSuperAdmin();
  const { id } = await params;
  return <AssessmentBuilderScreen bank={{ kind: "platform" }} scope={{ organizationId: null }} id={id} />;
}
