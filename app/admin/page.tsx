import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { requireSuperAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Administration" };

// Vue en lecture seule ; la gestion (suspension, comptes, contenus) arrive en phase 10.
export default async function AdminPage() {
  const user = await requireSuperAdmin();
  const [userCount, organizationCount, organizations] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, slug: true, status: true, createdAt: true, _count: { select: { memberships: true } } },
    }),
  ]);

  return (
    <AppShell user={user} context="Administration">
      <h1 className="text-3xl font-semibold">Administration</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Comptes</dt>
          <dd className="mt-1 text-3xl font-semibold tabular">{userCount}</dd>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Organisations</dt>
          <dd className="mt-1 text-3xl font-semibold tabular">{organizationCount}</dd>
        </div>
      </dl>

      <h2 className="mt-12 text-lg font-semibold">Organisations récentes</h2>
      {organizations.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Aucune organisation pour le moment.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Membres</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Créée le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td className="px-6 py-3">
                    <span className="font-medium">{org.name}</span>
                    <span className="block text-muted-foreground">{org.slug}</span>
                  </td>
                  <td className="px-6 py-3 tabular">{org._count.memberships}</td>
                  <td className="px-6 py-3">{org.status === "ACTIVE" ? "Active" : "Suspendue"}</td>
                  <td className="px-6 py-3 tabular whitespace-nowrap">
                    {format(org.createdAt, "d MMM yyyy", { locale: fr })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
