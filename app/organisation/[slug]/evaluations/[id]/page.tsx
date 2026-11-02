import type { Metadata } from "next";
import { AssessmentBuilderScreen } from "@/features/assessments/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Évaluation" };

export default async function OrgAssessmentPage({ params }: PageProps<"/organisation/[slug]/evaluations/[id]">) {
  const { slug, id } = await params;
  const { organization } = await requireOrgMember(slug, "assessments:write");
  return (
    <AssessmentBuilderScreen
      bank={{ kind: "organization", slug: organization.slug }}
      scope={{ organizationId: organization.id }}
      id={id}
    />
  );
}
