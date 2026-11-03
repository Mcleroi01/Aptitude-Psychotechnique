import type { Metadata } from "next";
import { ImportJobScreen } from "@/features/imports/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Vérification de l'import" };

export default async function OrgImportJobPage({ params }: PageProps<"/organisation/[slug]/import/[jobId]">) {
  const { slug, jobId } = await params;
  const { organization } = await requireOrgMember(slug, "questions:write");
  return <ImportJobScreen bank={{ kind: "organization", slug: organization.slug }} scope={{ organizationId: organization.id }} jobId={jobId} />;
}
