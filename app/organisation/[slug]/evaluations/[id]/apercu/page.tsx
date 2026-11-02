import type { Metadata } from "next";
import { AssessmentPreviewScreen } from "@/features/assessments/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Aperçu de l'examen" };

export default async function OrgAssessmentPreviewPage({ params }: PageProps<"/organisation/[slug]/evaluations/[id]/apercu">) {
  const { slug, id } = await params;
  const { organization } = await requireOrgMember(slug, "assessments:write");
  return (
    <AssessmentPreviewScreen
      bank={{ kind: "organization", slug: organization.slug }}
      scope={{ organizationId: organization.id }}
      id={id}
    />
  );
}
