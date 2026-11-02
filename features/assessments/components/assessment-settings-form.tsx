"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateAssessmentSettingsAction } from "@/features/assessments/actions";
import type { BankRef } from "@/features/questions/bank";
import { TIMING_MODES, timingModeLabels } from "@/lib/assessments/labels";
import { useMutation } from "@/lib/use-mutation";
import { cn } from "@/lib/utils";
import type { TimingMode } from "@/generated/prisma/enums";

type Settings = {
  title: string;
  description: string | null;
  instructions: string | null;
  timingMode: TimingMode;
  durationSeconds: number | null;
  passingPercent: number | null;
};

/** Champ numérique facultatif : chaîne vide → null. */
export const toNumberOrNull = (value: string) => (value.trim() === "" ? null : Number(value.replace(",", ".")));

export function AssessmentSettingsForm({
  bank,
  assessmentId,
  initial,
  disabled,
}: {
  bank: BankRef;
  assessmentId: string;
  initial: Settings;
  disabled: boolean;
}) {
  const { run, pending } = useMutation();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [values, setValues] = useState({
    title: initial.title,
    description: initial.description ?? "",
    instructions: initial.instructions ?? "",
    timingMode: initial.timingMode,
    durationMinutes: initial.durationSeconds ? String(initial.durationSeconds / 60) : "",
    passingPercent: initial.passingPercent?.toString() ?? "",
  });
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));

  const save = () =>
    run(
      () =>
        updateAssessmentSettingsAction(bank, assessmentId, {
          ...values,
          durationMinutes: toNumberOrNull(values.durationMinutes),
          passingPercent: toNumberOrNull(values.passingPercent),
        }),
      {
        success: "Paramètres enregistrés.",
        onError: (r) => setErrors(r.error.fieldErrors ?? { form: [r.error.message] }),
      },
    ).then((ok) => ok && setErrors({}));

  return (
    <fieldset disabled={disabled} className="space-y-5">
      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel htmlFor="a-title">Titre</FieldLabel>
        <Input id="a-title" value={values.title} onChange={(e) => set("title", e.target.value)} />
        <FieldError errors={errors.title?.map((message) => ({ message }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="a-description">Description (interne)</FieldLabel>
        <Textarea id="a-description" rows={2} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field>
        <FieldLabel htmlFor="a-instructions">Consignes générales</FieldLabel>
        <Textarea id="a-instructions" rows={3} value={values.instructions} onChange={(e) => set("instructions", e.target.value)} />
        <FieldDescription>Affichées au candidat avant le début de l&apos;évaluation.</FieldDescription>
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium">Chronométrage</p>
        <div role="radiogroup" aria-label="Chronométrage" className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          {TIMING_MODES.map((mode) => (
            <label
              key={mode}
              className={cn(
                "cursor-pointer rounded-lg border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                values.timingMode === mode ? "border-primary bg-primary/5" : "hover:bg-muted/60",
              )}
            >
              <input
                type="radio"
                className="sr-only"
                checked={values.timingMode === mode}
                onChange={() => set("timingMode", mode)}
              />
              <span className="block text-sm font-medium">{timingModeLabels[mode].label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{timingModeLabels[mode].hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {values.timingMode === "GLOBAL" && (
          <Field data-invalid={Boolean(errors.durationMinutes)}>
            <FieldLabel htmlFor="a-duration">Durée globale (minutes)</FieldLabel>
            <Input
              id="a-duration"
              type="number"
              min={1}
              inputMode="numeric"
              value={values.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value)}
            />
            <FieldError errors={errors.durationMinutes?.map((message) => ({ message }))} />
          </Field>
        )}
        <Field data-invalid={Boolean(errors.passingPercent)}>
          <FieldLabel htmlFor="a-passing">Seuil de réussite global (%)</FieldLabel>
          <Input
            id="a-passing"
            type="number"
            min={0}
            max={100}
            placeholder="facultatif"
            value={values.passingPercent}
            onChange={(e) => set("passingPercent", e.target.value)}
          />
          <FieldError errors={errors.passingPercent?.map((message) => ({ message }))} />
        </Field>
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form[0]}</p>}
      <Button onClick={save} disabled={pending || disabled}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Enregistrer les paramètres
      </Button>
    </fieldset>
  );
}
