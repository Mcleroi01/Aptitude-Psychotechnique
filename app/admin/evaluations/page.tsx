import type { Metadata } from "next";
import { AssessmentListScreen } from "@/features/assessments/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Évaluations" };

export default async function AdminAssessmentsPage() {
  await requireSuperAdmin();
  return (
    <AssessmentListScreen
      bank={{ kind: "platform" }}
      scope={{ organizationId: null }}
      description="Examens blancs de la plateforme, proposés aux candidats pour s'entraîner. Les organisations peuvent aussi les réutiliser dans leurs campagnes."
    />
  );
}
