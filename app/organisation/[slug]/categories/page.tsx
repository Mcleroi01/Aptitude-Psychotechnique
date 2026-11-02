import type { Metadata } from "next";
import { CategoriesScreen } from "@/features/questions/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Catégories" };

export default async function OrgCategoriesPage({ params }: PageProps<"/organisation/[slug]/categories">) {
  const { slug } = await params;
  const { organization } = await requireOrgMember(slug, "questions:write");
  return (
    <CategoriesScreen
      bank={{ kind: "organization", slug: organization.slug }}
      scope={{ organizationId: organization.id }}
      title="Catégories"
      description="Classez vos questions par matière ou compétence pour les retrouver et les tirer au hasard dans vos épreuves."
    />
  );
}
