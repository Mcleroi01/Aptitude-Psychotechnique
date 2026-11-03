import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Clock, ListOrdered, MailCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LocalDate } from "@/components/shared/local-date";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { StartCampaignButton } from "@/features/attempts/components/start-buttons";
import { formatDuration } from "@/lib/assessments/labels";
import { getSessionUser } from "@/lib/guards";
import { siteConfig } from "@/lib/site";
import { userCampaignAttempts } from "@/services/attempt-view.service";
import { getInvitationByToken } from "@/services/invitation.service";

export const metadata: Metadata = { title: "Invitation", robots: { index: false } };

/** Page du lien personnel reçu par e-mail : la participation exige l'adresse invitée. */
export default async function InvitationPage({ params }: PageProps<"/invitation/[token]">) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  const user = await getSessionUser();
  const callback = `/invitation/${token}`;

  const shell = (content: React.ReactNode) => (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Logo inverted />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">{content}</main>
    </div>
  );

  if (!invitation || invitation.status === "REVOKED" || invitation.campaign.organization.status !== "ACTIVE") {
    return shell(
      <div className="rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-semibold">Invitation indisponible</h1>
        <p className="mt-2 text-muted-foreground">
          Ce lien n&apos;est pas valide ou l&apos;invitation a été retirée. Contactez l&apos;organisation qui vous l&apos;a envoyé.
        </p>
      </div>,
    );
  }

  const { campaign } = invitation;
  const now = new Date();
  const closed = campaign.status !== "PUBLISHED" || (campaign.closesAt !== null && campaign.closesAt <= now);
  const notOpen = campaign.opensAt !== null && campaign.opensAt > now;
  const sameEmail = user?.email.toLowerCase() === invitation.email;
  const attempts = user && sameEmail ? await userCampaignAttempts(user.id, campaign.id) : [];
  const ongoing = attempts.find((a) => a.status === "IN_PROGRESS");
  const finished = attempts.find((a) => a.status !== "IN_PROGRESS");
  const exhausted = !ongoing && attempts.length >= campaign.maxAttempts;
  const { assessment } = campaign;

  return shell(
    <>
      <p className="text-sm font-medium text-muted-foreground">{campaign.organization.name} vous invite</p>
      <h1 className="mt-1 text-3xl font-semibold">{campaign.title}</h1>
      {campaign.description && <p className="mt-3 whitespace-pre-line text-muted-foreground">{campaign.description}</p>}

      <dl className="mt-8 divide-y rounded-xl border bg-card text-sm">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <MailCheck className="size-4 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Adresse invitée</dt>
          <dd>
            Invitation adressée à <strong>{invitation.email}</strong>
          </dd>
        </div>
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
        {campaign.closesAt && (
          <div className="flex items-center gap-3 px-5 py-3.5">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Date limite</dt>
            <dd>
              À passer avant le <LocalDate value={campaign.closesAt} />
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-8 space-y-4">
        {closed ? (
          <p className="font-medium">Cette campagne est clôturée.</p>
        ) : notOpen ? (
          <p className="font-medium">
            Ouverture le <LocalDate value={campaign.opensAt} />.
          </p>
        ) : !user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Connectez-vous ou créez un compte avec l&apos;adresse <strong className="text-foreground">{invitation.email}</strong>. Le plus
              simple : recevez un lien de connexion à cette adresse.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link href={`/connexion?callbackUrl=${encodeURIComponent(callback)}`}>Se connecter</Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </div>
          </>
        ) : !sameEmail ? (
          <>
            <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
              Vous êtes connecté avec <strong>{user.email}</strong>, mais cette invitation est destinée à{" "}
              <strong>{invitation.email}</strong>. Déconnectez-vous puis reconnectez-vous avec la bonne adresse.
            </p>
            <form action={logoutAction}>
              <Button type="submit" variant="outline">
                Se déconnecter
              </Button>
            </form>
          </>
        ) : exhausted ? (
          <p className="font-medium">Vous avez utilisé toutes les tentatives autorisées.</p>
        ) : (
          <StartCampaignButton campaignId={campaign.id} label={ongoing ? "Reprendre l'évaluation" : "Commencer l'évaluation"} />
        )}

        {finished && (
          <p className="text-sm">
            <Link href={`/tentative/${finished.id}/resultat`} className="font-medium text-primary underline-offset-4 hover:underline">
              Voir ma participation
            </Link>
          </p>
        )}
      </div>

      <p className="mt-12 text-xs leading-relaxed text-muted-foreground">
        Évaluation organisée par {campaign.organization.name} sur {siteConfig.name}. {siteConfig.disclaimer}
      </p>
    </>,
  );
}
