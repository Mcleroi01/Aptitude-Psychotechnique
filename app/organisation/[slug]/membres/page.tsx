import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireOrgMember } from "@/lib/guards";
import { orgRoleLabels } from "@/lib/permissions";
import { getOrganizationMembers } from "@/services/organization.service";

export const metadata: Metadata = { title: "Membres" };

export default async function MembresPage({ params }: PageProps<"/organisation/[slug]/membres">) {
  const { slug } = await params;
  const { organization } = await requireOrgMember(slug, "members:manage");
  const members = await getOrganizationMembers(organization.id);

  return (
    <>
      <h1 className="text-3xl font-semibold">Membres</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Personnes ayant accès à l&apos;espace de {organization.name}. L&apos;invitation de collaborateurs sera
        disponible avec le module d&apos;invitations.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Nom</th>
              <th className="px-6 py-3 font-medium">Rôle</th>
              <th className="px-6 py-3 font-medium">Depuis le</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-3">
                  <span className="font-medium">{member.user.name}</span>
                  <span className="block text-muted-foreground">{member.user.email}</span>
                </td>
                <td className="px-6 py-3">{orgRoleLabels[member.role]}</td>
                <td className="px-6 py-3 tabular whitespace-nowrap">
                  {format(member.createdAt, "d MMM yyyy", { locale: fr })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
