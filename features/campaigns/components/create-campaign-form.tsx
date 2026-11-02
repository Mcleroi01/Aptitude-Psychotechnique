"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { createCampaignAction } from "@/features/campaigns/actions";
import { useMutation } from "@/lib/use-mutation";

type Option = { id: string; title: string; platform: boolean; ready: boolean };

export function CreateCampaignForm({ slug, assessments }: { slug: string; assessments: Option[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const { run, pending } = useMutation();
  const own = assessments.filter((a) => !a.platform);
  const platform = assessments.filter((a) => a.platform);

  if (!open) {
    return (
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Nouvelle campagne
      </Button>
    );
  }

  return (
    <form
      className="w-full space-y-4 rounded-xl border bg-card p-5 sm:max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => createCampaignAction(slug, { title, assessmentId }), {
          onError: (r) => setErrors(r.error.fieldErrors ?? { form: [r.error.message] }),
        });
      }}
    >
      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel htmlFor="c-title">Titre de la campagne</FieldLabel>
        <Input id="c-title" autoFocus placeholder="Ex. Recrutement analystes 2027" value={title} onChange={(e) => setTitle(e.target.value)} />
        <FieldError errors={errors.title?.map((message) => ({ message }))} />
      </Field>
      <Field data-invalid={Boolean(errors.assessmentId)}>
        <FieldLabel htmlFor="c-assessment">Évaluation</FieldLabel>
        <NativeSelect id="c-assessment" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
          <option value="">Choisir…</option>
          {own.length > 0 && (
            <optgroup label="Mes évaluations">
              {own.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                  {!a.ready && " (brouillon)"}
                </option>
              ))}
            </optgroup>
          )}
          {platform.length > 0 && (
            <optgroup label="Évaluations Aptitude">
              {platform.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </optgroup>
          )}
        </NativeSelect>
        <FieldError errors={errors.assessmentId?.map((message) => ({ message }))} />
        {assessments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune évaluation disponible.{" "}
            <Link href={`/organisation/${slug}/evaluations`} className="font-medium text-primary underline-offset-4 hover:underline">
              Créer une évaluation
            </Link>
          </p>
        )}
      </Field>
      {errors.form && <p className="text-sm text-destructive">{errors.form[0]}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Créer la campagne
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
