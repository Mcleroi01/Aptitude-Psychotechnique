import type { Metadata } from "next";
import { CategoriesScreen } from "@/features/questions/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  await requireSuperAdmin();
  return (
    <CategoriesScreen
      bank={{ kind: "platform" }}
      scope={{ organizationId: null }}
      title="Catégories de la banque Aptitude"
      description="Catégories pédagogiques affichées aux candidats. Leur identifiant d'URL est conservé lors d'un renommage."
    />
  );
}
