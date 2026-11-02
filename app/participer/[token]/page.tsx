import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Clock, ListOrdered } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LocalDate } from "@/components/shared/local-date";
import { Button } from "@/components/ui/button";
import { StartCampaignButton } from "@/features/attempts/components/start-buttons";
import { formatDuration, resultsVisibilityLabels } from "@/lib/assessments/labels";
import { getSessionUser } from "@/lib/guards";
import { siteConfig } from "@/lib/site";
import { getCampaignByToken, userCampaignAttempts } from "@/services/attempt-view.service";

export const metadata: Metadata = { title: "Participer à une évaluation", robots: { index: false } };

/** Page publique d'une campagne par lien : consultable sans compte, participation après connexion. */
export default async function ParticiperPage({ params }: PageProps<"/participer/[token]">) {
  const { token } = await params;
  const campaign = await getCampaignByToken(token);
  if (!campaign || campaign.accessMode !== "LINK" || campaign.organization.status !== "ACTIVE" || campaign.status === "DRAFT") {
    notFound();
  }

  const user = await getSessionUser();
  const attempts = user ? await userCampaignAttempts(user.id, campaign.id) : [];
  const ongoing = attempts.find((a) => a.status === "IN_PROGRESS");
  const now = new Date();
  const notOpen = campaign.opensAt && campaign.opensAt > now;
  const closed = campaign.status !== "PUBLISHED" || (campaign.closesAt && campaign.closesAt <= now);
  const exhausted = !ongoing && attempts.length >= campaign.maxAttempts;
  const { assessment } = campaign;
  const callback = `/participer/${token}`;

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Logo inverted />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <p className="text-sm font-medium text-muted-foreground">{campaign.organization.name}</p>
        <h1 className="mt-1 text-3xl font-semibold">{campaign.title}</h1>
        {campaign.description && <p className="mt-3 whitespace-pre-line text-muted-foreground">{campaign.description}</p>}

        <dl className="mt-8 divide-y rounded-xl border bg-card text-sm">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <ListOrdered className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Épreuves</dt>
            <dd>
              {assessment.sections.length} épreuve(s) : {assessment.sections.map((s) => s.title).join(", ")}
            </dd>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Durée</dt>
            <dd>
              {assessment.timingMode === "GLOBAL"
                ? `Durée totale : ${formatDuration(assessment.durationSeconds)}`
                : assessment.timingMode === "PER_SECTION"
                  ? `Durée par épreuve : ${assessment.sections.map((s) => formatDuration(s.durationSeconds)).join(" + ")}`
                  : "Sans limite de temps"}
            </dd>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Période</dt>
            <dd>
              {campaign.closesAt ? (
                <>
                  Clôture le <LocalDate value={campaign.closesAt} />
                </>
              ) : (
                "Sans date de clôture annoncée"
              )}
              {campaign.maxAttempts > 1 && ` · ${campaign.maxAttempts} tentatives autorisées`}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">Résultats : {resultsVisibilityLabels[campaign.resultsVisibility].hint}</p>

        <div className="mt-8">
          {closed ? (
            <p className="font-medium">Cette campagne est clôturée.</p>
          ) : notOpen ? (
            <p className="font-medium">
              Ouverture le <LocalDate value={campaign.opensAt} />.
            </p>
          ) : !user ? (
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link href={`/connexion?callbackUrl=${encodeURIComponent(callback)}`}>Se connecter pour participer</Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </div>
          ) : exhausted ? (
            <p className="font-medium">Vous avez utilisé toutes les tentatives autorisées.</p>
          ) : (
            <StartCampaignButton campaignId={campaign.id} token={token} label={ongoing ? "Reprendre l'évaluation" : "Commencer l'évaluation"} />
          )}
        </div>

        {attempts.some((a) => a.status !== "IN_PROGRESS") && (
          <p className="mt-6 text-sm">
            <Link href={`/tentative/${attempts.find((a) => a.status !== "IN_PROGRESS")!.id}/resultat`} className="font-medium text-primary underline-offset-4 hover:underline">
              Voir ma dernière participation
            </Link>
          </p>
        )}
        <p className="mt-12 text-xs leading-relaxed text-muted-foreground">
          Évaluation organisée par {campaign.organization.name} sur {siteConfig.name}. {siteConfig.disclaimer}
        </p>
      </main>
    </div>
  );
}
