import type { Metadata } from "next";
import { AssessmentListScreen } from "@/features/assessments/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Évaluations" };

export default async function OrgAssessmentsPage({ params }: PageProps<"/organisation/[slug]/evaluations">) {
  const { slug } = await params;
  const { organization } = await requireOrgMember(slug, "assessments:write");
  return (
    <AssessmentListScreen
      bank={{ kind: "organization", slug: organization.slug }}
      scope={{ organizationId: organization.id }}
      description="Composez vos évaluations : une ou plusieurs épreuves, avec leurs durées, barèmes, seuils et questions. Une évaluation peut servir à plusieurs campagnes."
    />
  );
}
