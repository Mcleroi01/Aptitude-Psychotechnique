import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, History, ShieldCheck } from "lucide-react";
import { LocalDate } from "@/components/shared/local-date";
import { Button } from "@/components/ui/button";
import { formatPoints } from "@/lib/assessments/labels";
import { resultAccess } from "@/lib/attempts/visibility";
import { getUserOrganizations, requireUser } from "@/lib/guards";
import { orgRoleLabels } from "@/lib/permissions";
import { listUserAttempts } from "@/services/attempt-view.service";

export const metadata: Metadata = { title: "Mon espace" };

const statusText: Record<string, string> = { IN_PROGRESS: "En cours", PENDING_REVIEW: "En correction", COMPLETED: "Terminée" };

// Le tableau de bord complet (statistiques de progression) est livré en phase 9.
export default async function EspacePage() {
  const user = await requireUser();
  const [memberships, attempts] = await Promise.all([getUserOrganizations(user.id), listUserAttempts(user.id)]);

  return (
    <>
      <p className="text-sm font-medium text-muted-foreground">Mon espace</p>
      <h1 className="mt-2 text-3xl font-semibold">Bonjour {user.name}</h1>
      <div className="mt-5">
        <Button asChild size="lg">
          <Link href="/entrainement">
            S&apos;entraîner <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      <section className="mt-10 rounded-xl border bg-card">
        <h2 className="flex items-center gap-2 border-b px-6 py-4 text-lg font-semibold">
          <History className="size-5 text-muted-foreground" aria-hidden /> Mes tentatives récentes
        </h2>
        {attempts.length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">Aucune tentative pour le moment.</p>
        ) : (
          <ul className="divide-y">
            {attempts.map((a) => {
              const hidden = a.campaign && resultAccess(a.campaign) === "none";
              const title = a.campaign?.title ?? a.assessment?.title ?? (a.category ? `Entraînement · ${a.category.name}` : "Entraînement");
              return (
                <li key={a.id}>
                  <Link
                    href={a.status === "IN_PROGRESS" ? `/tentative/${a.id}` : `/tentative/${a.id}/resultat`}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 hover:bg-muted/40"
                  >
                    <span>
                      <span className="font-medium">{title}</span>
                      <span className="block text-sm text-muted-foreground">
                        <LocalDate value={a.startedAt} /> · {statusText[a.status]}
                      </span>
                    </span>
                    <span className="text-sm font-medium tabular">
                      {a.status === "IN_PROGRESS"
                        ? "Reprendre"
                        : hidden || a.score === null || !a.maxScore
                          ? ""
                          : `${formatPoints(a.score)} / ${formatPoints(a.maxScore)}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
    </>
  );
}
