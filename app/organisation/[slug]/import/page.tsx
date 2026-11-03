import type { Metadata } from "next";
import { ImportListScreen } from "@/features/imports/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Importer des questions" };

export default async function OrgImportPage({ params }: PageProps<"/organisation/[slug]/import">) {
  const { slug } = await params;
  const { organization } = await requireOrgMember(slug, "questions:write");
  return <ImportListScreen bank={{ kind: "organization", slug: organization.slug }} scope={{ organizationId: organization.id }} />;
}
