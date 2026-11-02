import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getUserOrganizations, requireUser } from "@/lib/guards";
import { orgRoleLabels } from "@/lib/permissions";

export const metadata: Metadata = { title: "Mon espace" };

// Le tableau de bord candidat (entraînement, résultats) est livré en phases 6 et 9.
export default async function EspacePage() {
  const user = await requireUser();
  const memberships = await getUserOrganizations(user.id);

  return (
    <AppShell user={user}>
      <p className="text-sm font-medium text-muted-foreground">Mon espace</p>
      <h1 className="mt-2 text-3xl font-semibold">Bonjour {user.name}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Votre compte est actif. L&apos;entraînement et vos évaluations apparaîtront ici dans les prochaines phases.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="size-5 text-muted-foreground" aria-hidden /> Mes organisations
          </h2>
          {memberships.length > 0 ? (
            <ul className="mt-4 divide-y">
              {memberships.map(({ organization, role }) => (
                <li key={organization.id}>
                  <Link
                    href={`/organisation/${organization.slug}`}
                    className="group flex items-center justify-between gap-4 py-3"
                  >
                    <span>
                      <span className="font-medium group-hover:underline">{organization.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {orgRoleLabels[role]}
                        {organization.status === "SUSPENDED" && " · suspendue"}
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Vous recrutez ? Créez un espace pour composer vos questionnaires et organiser vos campagnes.
            </p>
          )}
          <Button asChild variant="outline" className="mt-5">
            <Link href="/entreprise/inscription">Créer une organisation</Link>
          </Button>
        </section>

        {user.platformRole === "SUPER_ADMIN" && (
          <section className="rounded-xl border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="size-5 text-muted-foreground" aria-hidden /> Administration
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Organisations et comptes de la plateforme.</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/admin">Ouvrir l&apos;administration</Link>
            </Button>
          </section>
        )}
      </div>
    </AppShell>
  );
}
