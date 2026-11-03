import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalDate } from "@/components/shared/local-date";
import { AccountMenu } from "@/features/admin/components/admin-buttons";
import { requireSuperAdmin } from "@/lib/guards";
import { listUsers } from "@/services/admin.service";

export const metadata: Metadata = { title: "Comptes" };

export default async function AdminAccountsPage({ searchParams }: PageProps<"/admin/comptes">) {
  const actor = await requireSuperAdmin();
  const { q, page } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const { users, total, page: current, pageCount } = await listUsers({ search: search || undefined, page: Number(page) || 1 });
  const href = (p: number) => `/admin/comptes?${new URLSearchParams({ ...(search && { q: search }), page: String(p) })}`;

  return (
    <>
      <h1 className="text-3xl font-semibold">Comptes</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Un compte désactivé est déconnecté sous 5 minutes. La plateforme garde toujours au moins un super-administrateur actif.
      </p>
      <form method="get" className="mt-6 flex max-w-md gap-2">
        <Input name="q" defaultValue={search} placeholder="Nom ou adresse e-mail" aria-label="Rechercher un compte" />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground tabular">{total} compte(s)</p>

      <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Compte</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 text-right font-medium">Organisations</th>
              <th className="px-5 py-3 text-right font-medium">Tentatives</th>
              <th className="px-5 py-3 font-medium">Dernière connexion</th>
              <th className="w-12 px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className={u.isActive ? undefined : "opacity-60"}>
                <td className="px-5 py-3">
                  <span className="font-medium">{u.name}</span>
                  <span className="block text-xs text-muted-foreground">{u.email}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.platformRole === "SUPER_ADMIN" && <Badge variant="sky">Super-admin</Badge>}
                    <Badge variant={u.isActive ? "success" : "secondary"}>{u.isActive ? "Actif" : "Désactivé"}</Badge>
                    {!u.emailVerifiedAt && <Badge variant="outline">E-mail non confirmé</Badge>}
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular">{u._count.memberships}</td>
                <td className="px-5 py-3 text-right tabular">{u._count.attempts}</td>
                <td className="px-5 py-3 whitespace-nowrap tabular">
                  <LocalDate value={u.lastLoginAt} />
                </td>
                <td className="px-3 py-2">
                  <AccountMenu userId={u.id} email={u.email} isActive={u.isActive} role={u.platformRole} isSelf={u.id === actor.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground tabular">
            Page {current} sur {pageCount}
          </span>
          <div className="flex gap-2">
            {current > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={href(current - 1)}>Précédente</Link>
              </Button>
            )}
            {current < pageCount && (
              <Button asChild variant="outline" size="sm">
                <Link href={href(current + 1)}>Suivante</Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
