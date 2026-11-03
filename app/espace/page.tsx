import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, History, Mail, ShieldCheck, Target } from "lucide-react";
import { LocalDate } from "@/components/shared/local-date";
import { Button } from "@/components/ui/button";
import { formatPoints } from "@/lib/assessments/labels";
import { resultAccess } from "@/lib/attempts/visibility";
import { getUserOrganizations, requireUser } from "@/lib/guards";
import { orgRoleLabels } from "@/lib/permissions";
import { listUserAttempts } from "@/services/attempt-view.service";
import { PercentBars, ProgressBars } from "@/features/results/components/charts";
import { getCandidateDashboard } from "@/services/dashboard.service";
import { listUserInvitations } from "@/services/invitation.service";

export const metadata: Metadata = { title: "Mon espace" };

const statusText: Record<string, string> = { IN_PROGRESS: "En cours", PENDING_REVIEW: "En correction", COMPLETED: "Terminée" };

const pct = (n: number | null) => (n === null ? "—" : `${String(n).replace(".", ",")} %`);

export default async function EspacePage() {
  const user = await requireUser();
  const [memberships, attempts, dashboard, invitations] = await Promise.all([
    getUserOrganizations(user.id),
    listUserAttempts(user.id),
    getCandidateDashboard(user.id),
    listUserInvitations(user.email),
  ]);
  const tiles = [
    { label: "Tentatives terminées", value: String(dashboard.totalAttempts) },
    { label: "Score moyen", value: pct(dashboard.average) },
    { label: "Meilleur score", value: pct(dashboard.best) },
    { label: "Questions répondues", value: String(dashboard.answered) },
  ];

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

      {invitations.length > 0 && (
        <section className="mt-8 rounded-xl border border-brand-sky/40 bg-card">
          <h2 className="flex items-center gap-2 border-b px-6 py-4 text-lg font-semibold">
            <Mail className="size-5 text-muted-foreground" aria-hidden /> Invitations reçues
          </h2>
          <ul className="divide-y">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
                <span>
                  <span className="font-medium">{inv.campaign.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {inv.campaign.organization.name}
                    {inv.campaign.closesAt && (
                      <>
                        {" "}
                        · avant le <LocalDate value={inv.campaign.closesAt} />
                      </>
                    )}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">Ouvrez le lien reçu par e-mail pour participer.</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular">{tile.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Progression</h2>
          <ProgressBars
            points={dashboard.recent.map((r) => ({
              id: r.id,
              percent: r.percent,
              label: r.label,
              date: r.date ? r.date.toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "",
            }))}
          />
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Réussite par catégorie</h2>
          <PercentBars
            rows={dashboard.categories.map((c) => ({ key: c.name, label: c.name, percent: c.percent, detail: `${c.correct}/${c.total}` }))}
          />
          {dashboard.weakest.length > 0 && (
            <p className="mt-5 flex gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
              <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                À retravailler en priorité : <strong>{dashboard.weakest.map((c) => c.name).join(", ")}</strong>.{" "}
                <Link href="/entrainement" className="font-medium text-primary underline-offset-4 hover:underline">
                  S&apos;entraîner
                </Link>
              </span>
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-card">
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
