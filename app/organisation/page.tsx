import { redirect } from "next/navigation";
import { getUserOrganizations, requireUser } from "@/lib/guards";

/** Raccourci : ouvre la première organisation, ou propose d'en créer une. */
export default async function OrganisationIndexPage() {
  const user = await requireUser();
  const [first] = await getUserOrganizations(user.id);
  redirect(first ? `/organisation/${first.organization.slug}` : "/entreprise/inscription");
}
