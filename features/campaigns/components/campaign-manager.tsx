"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, BarChart3, CircleStop, Copy, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fromDateTimeLocal, LocalDate, toDateTimeLocal } from "@/components/shared/local-date";
import { changeCampaignStatusAction, updateCampaignAction } from "@/features/campaigns/actions";
import {
  CAMPAIGN_ACCESS,
  campaignAccessLabels,
  campaignStatusLabels,
  RESULTS_VISIBILITY,
  resultsVisibilityLabels,
} from "@/lib/assessments/labels";
import { useMutation } from "@/lib/use-mutation";
import { cn } from "@/lib/utils";
import type { CampaignAccess, CampaignStatus, ResultsVisibility } from "@/generated/prisma/enums";

export type ManagedCampaign = {
  id: string;
  title: string;
  description: string | null;
  status: CampaignStatus;
  accessMode: CampaignAccess;
  resultsVisibility: ResultsVisibility;
  opensAt: Date | null;
  closesAt: Date | null;
  publishedAt: Date | null;
  maxAttempts: number;
  publicToken: string | null;
  assessment: { id: string; title: string; status: string; organizationId: string | null };
  attempts: number;
  invitations: number;
};

export function CampaignManager({ slug, campaign, participationUrl }: { slug: string; campaign: ManagedCampaign; participationUrl: string | null }) {
  const router = useRouter();
  const { run, pending } = useMutation();
  const draft = campaign.status === "DRAFT";
  const readOnly = campaign.status === "CLOSED" || campaign.status === "ARCHIVED";

  const status = (action: "publish" | "close" | "delete", confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    void run(() => changeCampaignStatusAction(slug, campaign.id, action), {
      success: (outcome) =>
        ({
          publish: "Campagne publiée.",
          close: "Campagne clôturée.",
          deleted: "Campagne supprimée.",
          archived: "Campagne archivée.",
        })[outcome] ?? "Campagne mise à jour.",
    }).then((ok) => ok && action === "delete" && router.push(`/organisation/${slug}/campagnes`));
  };

  const assessmentHref = campaign.assessment.organizationId ? `/organisation/${slug}/evaluations/${campaign.assessment.id}` : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold">{campaign.title}</h1>
            <Badge variant={campaign.status === "PUBLISHED" ? "success" : "secondary"}>{campaignStatusLabels[campaign.status]}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Évaluation :{" "}
            {assessmentHref ? (
              <Link href={assessmentHref} className="font-medium text-foreground underline-offset-4 hover:underline">
                {campaign.assessment.title}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{campaign.assessment.title} (Aptitude)</span>
            )}
            {campaign.assessment.status !== "PUBLISHED" && (
              <Badge variant="warning" className="ml-2">
                À valider avant publication
              </Badge>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!draft && (
            <Button asChild variant="outline">
              <Link href={`/organisation/${slug}/campagnes/${campaign.id}/resultats`}>
                <BarChart3 data-icon="inline-start" /> Résultats
              </Link>
            </Button>
          )}
          {draft && (
            <Button
              disabled={pending}
              onClick={() =>
                status("publish", "Publier la campagne ? Les règles d'accès, la visibilité des résultats et l'évaluation seront figées.")
              }
            >
              <Rocket data-icon="inline-start" /> Publier
            </Button>
          )}
          {campaign.status === "PUBLISHED" && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => status("close", "Clôturer la campagne maintenant ? Plus aucun candidat ne pourra commencer ou poursuivre.")}
            >
              <CircleStop data-icon="inline-start" /> Clôturer
            </Button>
          )}
          {campaign.status !== "PUBLISHED" && campaign.status !== "ARCHIVED" && (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() =>
                status(
                  "delete",
                  draft && campaign.attempts === 0
                    ? "Supprimer définitivement ce brouillon de campagne ?"
                    : "Archiver la campagne ? Ses résultats restent conservés.",
                )
              }
            >
              <Archive data-icon="inline-start" /> {draft && campaign.attempts === 0 ? "Supprimer" : "Archiver"}
            </Button>
          )}
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ouverture" value={<LocalDate value={campaign.opensAt} />} hint={campaign.opensAt ? undefined : "Dès la publication"} />
        <Stat label="Clôture" value={<LocalDate value={campaign.closesAt} />} hint={campaign.closesAt ? undefined : "Manuelle"} />
        <Stat label="Tentatives" value={campaign.attempts} />
        <Stat label="Invitations" value={campaign.invitations} />
      </dl>

      {campaign.status === "PUBLISHED" && campaign.accessMode === "LINK" && participationUrl && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Lien de participation</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={participationUrl} aria-label="Lien de participation" className="font-mono text-xs" />
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(participationUrl).then(() => toast.success("Lien copié."))}
            >
              <Copy data-icon="inline-start" /> Copier
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Toute personne disposant de ce lien peut consulter la campagne ; elle doit se connecter pour participer.
          </p>
        </section>
      )}


      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="font-heading text-base font-semibold">Réglages</h2>
        {campaign.status === "PUBLISHED" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Campagne en cours : seuls le titre, la description et la date de clôture restent modifiables.
          </p>
        )}
        <div className="mt-5">
          <CampaignSettingsForm key={`${campaign.status}-${String(campaign.closesAt)}`} slug={slug} campaign={campaign} readOnly={readOnly} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold tabular">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function CampaignSettingsForm({ slug, campaign, readOnly }: { slug: string; campaign: ManagedCampaign; readOnly: boolean }) {
  const { run, pending } = useMutation();
  const frozen = campaign.status !== "DRAFT";
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [v, setV] = useState({
    title: campaign.title,
    description: campaign.description ?? "",
    accessMode: campaign.accessMode,
    resultsVisibility: campaign.resultsVisibility,
    opensAt: toDateTimeLocal(campaign.opensAt),
    closesAt: toDateTimeLocal(campaign.closesAt),
    maxAttempts: String(campaign.maxAttempts),
  });
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [key]: value }));
  const err = (key: string) => errors[key]?.map((message) => ({ message }));

  const save = () =>
    run(
      () =>
        updateCampaignAction(slug, campaign.id, {
          ...v,
          opensAt: fromDateTimeLocal(v.opensAt),
          closesAt: fromDateTimeLocal(v.closesAt),
          maxAttempts: Number(v.maxAttempts),
        }),
      { success: "Réglages enregistrés.", onError: (r) => setErrors(r.error.fieldErrors ?? { form: [r.error.message] }) },
    ).then((ok) => ok && setErrors({}));

  return (
    <fieldset disabled={readOnly} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="cs-title">Titre</FieldLabel>
          <Input id="cs-title" value={v.title} onChange={(e) => set("title", e.target.value)} />
          <FieldError errors={err("title")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="cs-desc">Description pour les candidats</FieldLabel>
          <Textarea id="cs-desc" rows={2} value={v.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </div>

      <ChoiceGroup
        legend="Accès"
        disabled={frozen}
        options={CAMPAIGN_ACCESS.map((value) => ({ value, ...campaignAccessLabels[value] }))}
        value={v.accessMode}
        onChange={(value) => set("accessMode", value)}
      />
      <ChoiceGroup
        legend="Résultats communiqués au candidat"
        disabled={frozen}
        options={RESULTS_VISIBILITY.map((value) => ({ value, ...resultsVisibilityLabels[value] }))}
        value={v.resultsVisibility}
        onChange={(value) => set("resultsVisibility", value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="cs-opens">Ouverture</FieldLabel>
          <Input id="cs-opens" type="datetime-local" disabled={frozen} value={v.opensAt} onChange={(e) => set("opensAt", e.target.value)} />
          <FieldDescription>Vide : dès la publication.</FieldDescription>
        </Field>
        <Field data-invalid={Boolean(errors.closesAt)}>
          <FieldLabel htmlFor="cs-closes">Clôture</FieldLabel>
          <Input id="cs-closes" type="datetime-local" value={v.closesAt} onChange={(e) => set("closesAt", e.target.value)} />
          <FieldDescription>Vide : clôture manuelle.</FieldDescription>
          <FieldError errors={err("closesAt")} />
        </Field>
        <Field data-invalid={Boolean(errors.maxAttempts)}>
          <FieldLabel htmlFor="cs-attempts">Tentatives par candidat</FieldLabel>
          <Input
            id="cs-attempts"
            type="number"
            min={1}
            max={10}
            disabled={frozen}
            value={v.maxAttempts}
            onChange={(e) => set("maxAttempts", e.target.value)}
          />
          <FieldError errors={err("maxAttempts")} />
        </Field>
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form[0]}</p>}
      {!readOnly && (
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Enregistrer les réglages
        </Button>
      )}
    </fieldset>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  disabled,
}: {
  legend: string;
  options: { value: T; label: string; hint: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{legend}</p>
      <div role="radiogroup" aria-label={legend} className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "rounded-lg border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              value === option.value ? "border-primary bg-primary/5" : !disabled && "hover:bg-muted/60",
              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
            )}
          >
            <input type="radio" className="sr-only" disabled={disabled} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
