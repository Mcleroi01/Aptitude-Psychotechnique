import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalDate } from "@/components/shared/local-date";
import { OrganizationStatusButton } from "@/features/admin/components/admin-buttons";
import { requireSuperAdmin } from "@/lib/guards";
import { listOrganizations } from "@/services/admin.service";

export const metadata: Metadata = { title: "Organisations" };

export default async function AdminOrganisationsPage({ searchParams }: PageProps<"/admin/organisations">) {
  await requireSuperAdmin();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const organizations = await listOrganizations(search || undefined);

  return (
    <>
      <h1 className="text-3xl font-semibold">Organisations</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        L&apos;inscription des entreprises est libre : suspendez une organisation en cas d&apos;abus. Ses données sont conservées.
      </p>
      <form method="get" className="mt-6 flex max-w-md gap-2">
        <Input name="q" defaultValue={search} placeholder="Nom ou identifiant" aria-label="Rechercher une organisation" />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      {organizations.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Aucune organisation.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Organisation</th>
                <th className="px-5 py-3 font-medium">Propriétaire</th>
                <th className="px-5 py-3 text-right font-medium">Membres</th>
                <th className="px-5 py-3 text-right font-medium">Questions</th>
                <th className="px-5 py-3 text-right font-medium">Campagnes</th>
                <th className="px-5 py-3 font-medium">Créée le</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{org.name}</span>
                    <span className="block text-xs text-muted-foreground">{org.slug}</span>
                  </td>
                  <td className="px-5 py-3">{org.memberships[0]?.user.email ?? "—"}</td>
                  <td className="px-5 py-3 text-right tabular">{org._count.memberships}</td>
                  <td className="px-5 py-3 text-right tabular">{org._count.questions}</td>
                  <td className="px-5 py-3 text-right tabular">{org._count.campaigns}</td>
                  <td className="px-5 py-3 whitespace-nowrap tabular">
                    <LocalDate value={org.createdAt} withTime={false} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={org.status === "ACTIVE" ? "success" : "warning"}>{org.status === "ACTIVE" ? "Active" : "Suspendue"}</Badge>
                      <OrganizationStatusButton organizationId={org.id} name={org.name} status={org.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
