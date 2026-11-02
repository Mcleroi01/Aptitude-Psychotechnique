import { AppShell } from "@/components/layout/app-shell";
import { requireOrgMember } from "@/lib/guards";
import { can } from "@/lib/permissions";

export default async function OrganisationLayout({ children, params }: LayoutProps<"/organisation/[slug]">) {
  const { slug } = await params;
  const { user, organization, role } = await requireOrgMember(slug);
  const base = `/organisation/${organization.slug}`;

  // Seules les sections livrées figurent ici ; les suivantes s'ajoutent phase par phase.
  const nav = [
    { href: base, label: "Vue d'ensemble", exact: true },
    ...(can(role, "questions:write")
      ? [
          { href: `${base}/questions`, label: "Banque de questions" },
          { href: `${base}/categories`, label: "Catégories" },
        ]
      : []),
    ...(can(role, "assessments:write") ? [{ href: `${base}/evaluations`, label: "Évaluations" }] : []),
    ...(can(role, "campaigns:write") ? [{ href: `${base}/campagnes`, label: "Campagnes" }] : []),
    ...(can(role, "answers:grade") ? [{ href: `${base}/correction`, label: "Correction" }] : []),
    ...(can(role, "members:manage") ? [{ href: `${base}/membres`, label: "Membres" }] : []),
  ];

  return (
    <AppShell user={user} context={organization.name} nav={nav}>
      {children}
    </AppShell>
  );
}
