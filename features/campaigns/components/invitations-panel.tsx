"use client";

import { useState } from "react";
import { Ban, Loader2, Mail, RotateCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LocalDate } from "@/components/shared/local-date";
import { addInvitationsAction, revokeInvitationAction, sendInvitationsAction } from "@/features/campaigns/actions";
import { useMutation } from "@/lib/use-mutation";
import type { CampaignStatus, InvitationStatus } from "@/generated/prisma/enums";

type Invitation = {
  id: string;
  email: string;
  name: string | null;
  status: InvitationStatus;
  sentAt: Date | null;
  acceptedAt: Date | null;
  attempts: number;
};

const statusText: Record<InvitationStatus, { label: string; variant: "secondary" | "sky" | "success" | "outline" }> = {
  PENDING: { label: "À envoyer", variant: "secondary" },
  SENT: { label: "Envoyée", variant: "sky" },
  ACCEPTED: { label: "Acceptée", variant: "success" },
  REVOKED: { label: "Révoquée", variant: "outline" },
};

export function InvitationsPanel({
  slug,
  campaignId,
  campaignStatus,
  invitations,
}: {
  slug: string;
  campaignId: string;
  campaignStatus: CampaignStatus;
  invitations: Invitation[];
}) {
  const { run, pending } = useMutation();
  const [text, setText] = useState("");
  const editable = campaignStatus === "DRAFT" || campaignStatus === "PUBLISHED";
  const toSend = invitations.filter((i) => i.status === "PENDING").length;

  const add = () =>
    run(() => addInvitationsAction(slug, campaignId, text), {
      success: (r) =>
        `${r.added} candidat(s) ajouté(s)` +
        (r.skipped ? `, ${r.skipped} déjà invité(s)` : "") +
        (r.invalid.length ? `, ${r.invalid.length} ligne(s) ignorée(s) : ${r.invalid.slice(0, 3).join(" ; ")}` : "") +
        ".",
    }).then((ok) => ok && setText(""));

  const send = (invitationId?: string) =>
    run(() => sendInvitationsAction(slug, campaignId, invitationId), {
      success: (r) => {
        if (r.failed.length) toast.error(`Échec d'envoi pour : ${r.failed.join(", ")}`);
        return `${r.sent} invitation(s) envoyée(s)` + (r.deferred ? ` ; ${r.deferred} reportée(s) à demain (limite quotidienne).` : ".");
      },
    });

  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Candidats invités</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Chaque candidat reçoit un lien personnel et doit se connecter avec l&apos;adresse invitée pour participer.
          </p>
        </div>
        {editable && toSend > 0 && (
          <Button onClick={() => send()} disabled={pending || campaignStatus !== "PUBLISHED"} title={campaignStatus !== "PUBLISHED" ? "Publiez d'abord la campagne" : undefined}>
            {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Mail data-icon="inline-start" />}
            Envoyer {toSend} invitation(s)
          </Button>
        )}
      </div>

      {editable && (
        <div className="mt-5 space-y-2">
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Candidats à inviter"
            placeholder={"Une personne par ligne :\nawa.mbuyi@exemple.com\nJean Kabila <jean.kabila@exemple.com>\nmarie@exemple.com ; Marie Lukusa"}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {campaignStatus === "DRAFT" ? "Ajoutez vos candidats maintenant ; l'envoi sera possible après publication." : "200 candidats au maximum par ajout, 100 envois par jour."}
            </p>
            <Button variant="outline" onClick={add} disabled={pending || !text.trim()}>
              <UserPlus data-icon="inline-start" /> Ajouter à la liste
            </Button>
          </div>
        </div>
      )}

      {invitations.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Candidat</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5 font-medium">Envoyée le</th>
                <th className="px-4 py-2.5 text-right font-medium">Tentatives</th>
                <th className="w-20 px-2 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{inv.name ?? inv.email}</span>
                    {inv.name && <span className="block text-xs text-muted-foreground">{inv.email}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusText[inv.status].variant}>{statusText[inv.status].label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap tabular">
                    <LocalDate value={inv.sentAt} />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular">{inv.attempts}</td>
                  <td className="px-2 py-1.5">
                    {editable && inv.status !== "REVOKED" && (
                      <div className="flex justify-end">
                        {inv.status !== "PENDING" && campaignStatus === "PUBLISHED" && (
                          <Button variant="ghost" size="icon-sm" aria-label={`Renvoyer à ${inv.email}`} disabled={pending} onClick={() => send(inv.id)}>
                            <RotateCw />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Révoquer l'invitation de ${inv.email}`}
                          disabled={pending}
                          onClick={() => {
                            if (window.confirm(`Révoquer l'invitation de ${inv.email} ? Cette personne ne pourra plus commencer l'évaluation.`)) {
                              void run(() => revokeInvitationAction(slug, campaignId, inv.id), { success: "Invitation révoquée." });
                            }
                          }}
                        >
                          <Ban />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
