"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { History, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveQuestionAction } from "@/features/questions/actions";
import type { BankRef } from "@/features/questions/bank";
import { FileField, type UploadedFile } from "@/features/questions/components/file-field";
import { QuestionPreview } from "@/features/questions/components/question-preview";
import { FormAlert } from "@/features/auth/components/form-alert";
import {
  BLANK_MARKER,
  countBlanks,
  DIFFICULTIES,
  difficultyLabels,
  optionLabel,
  QUESTION_TYPES,
  questionTypeHints,
  questionTypeLabels,
} from "@/lib/questions/labels";
import { cn } from "@/lib/utils";
import { questionEditorSchema, type QuestionEditorValues } from "@/schemas/question";

type Props = {
  bank: BankRef;
  questionId: string | null;
  initialValues: QuestionEditorValues;
  initialMedia: { image: UploadedFile | null; attachment: UploadedFile | null };
  categories: { id: string; name: string }[];
  listPath: string;
  /** La question a déjà servi : l'enregistrement créera une nouvelle version */
  versionedOnSave: boolean;
  /**
   * Enregistrement personnalisé (ex. ligne d'import) à la place de la banque.
   * Renvoie un message d'erreur, ou null en cas de succès.
   */
  onSave?: (values: QuestionEditorValues, status: "DRAFT" | "PUBLISHED") => Promise<string | null>;
  labels?: { draft: string; publish: string };
};

const MAX_OPTIONS = 10;

export function QuestionEditor({
  bank,
  questionId,
  initialValues,
  initialMedia,
  categories,
  listPath,
  versionedOnSave,
  onSave,
  labels = { draft: "Enregistrer en brouillon", publish: "Publier" },
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [media, setMedia] = useState(initialMedia);

  const form = useForm<QuestionEditorValues>({
    resolver: zodResolver(questionEditorSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });
  const { control, register, setValue, formState } = form;
  const { errors } = formState;
  const values = useWatch({ control }) as QuestionEditorValues;
  const type = values.type;

  const options = useFieldArray({ control, name: "options" });
  const blanks = useFieldArray({ control, name: "blanks" });

  // Texte à compléter : une ligne de réponses par trou présent dans l'énoncé.
  const blankCount = type === "FILL_BLANK" ? countBlanks(values.prompt ?? "") : 0;
  useEffect(() => {
    if (type !== "FILL_BLANK") return;
    const current = form.getValues("blanks");
    if (current.length === blankCount) return;
    setValue(
      "blanks",
      Array.from({ length: blankCount }, (_, i) => current[i] ?? { accepted: "" }),
      { shouldValidate: formState.isSubmitted },
    );
  }, [type, blankCount, form, setValue, formState.isSubmitted]);

  const setFile = (kind: "image" | "attachment", file: UploadedFile | null) => {
    setMedia((m) => ({ ...m, [kind]: file }));
    if (kind === "image") setValue("imagePath", file?.path ?? null, { shouldDirty: true });
    else {
      setValue("attachmentPath", file?.path ?? null, { shouldDirty: true });
      setValue("attachmentName", file?.name ?? null, { shouldDirty: true });
    }
  };

  const submit = (status: "DRAFT" | "PUBLISHED") =>
    form.handleSubmit(
      (data) => {
        setServerError(null);
        startTransition(async () => {
          if (onSave) {
            const failure = await onSave(data, status);
            if (failure) setServerError(failure);
            return;
          }
          const result = await saveQuestionAction(bank, questionId, { values: data, status });
          if (!result.ok) {
            for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
              if (messages?.[0]) form.setError(field as keyof QuestionEditorValues, { message: messages[0] });
            }
            setServerError(result.error.message);
            return;
          }
          toast.success(
            result.data.versioned
              ? "Nouvelle version enregistrée."
              : status === "PUBLISHED"
                ? "Question publiée."
                : "Brouillon enregistré.",
          );
          router.push(listPath);
          router.refresh();
        });
      },
      (invalid) => setServerError(firstErrorMessage(invalid)),
    )();

  const isChoice = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
  const previewMedia = useMemo(
    () => ({
      imageUrl: media.image?.previewUrl ?? null,
      attachment: media.attachment ? { name: media.attachment.name, url: media.attachment.previewUrl ?? "#" } : null,
    }),
    [media],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
      <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-8">
        <FormAlert message={serverError} />

        {versionedOnSave && (
          <p className="flex gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
            <History className="mt-0.5 size-4 shrink-0" aria-hidden />
            Cette question a déjà été utilisée par des candidats. L&apos;enregistrement créera une nouvelle version ; les
            résultats passés restent liés à la version actuelle.
          </p>
        )}

        <Panel title="Format">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Format de la question" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {QUESTION_TYPES.map((t) => (
                  <label
                    key={t}
                    className={cn(
                      "cursor-pointer rounded-lg border bg-card p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                      field.value === t ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={field.name}
                      value={t}
                      checked={field.value === t}
                      onChange={() => field.onChange(t)}
                    />
                    <span className="block text-sm font-medium">{questionTypeLabels[t]}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{questionTypeHints[t]}</span>
                  </label>
                ))}
              </div>
            )}
          />
        </Panel>

        <Panel title="Énoncé">
          <Field data-invalid={Boolean(errors.prompt)}>
            <FieldLabel htmlFor="prompt" className="sr-only">
              Énoncé
            </FieldLabel>
            <Textarea id="prompt" rows={5} aria-invalid={Boolean(errors.prompt)} {...register("prompt")} />
            {type === "FILL_BLANK" && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("prompt", `${form.getValues("prompt").trimEnd()} ${BLANK_MARKER} `, { shouldDirty: true })}
                >
                  <Plus data-icon="inline-start" /> Insérer un trou
                </Button>
                <FieldDescription>Chaque « {BLANK_MARKER} » (trois tirets bas) devient un champ à remplir.</FieldDescription>
              </div>
            )}
            <FieldError errors={[errors.prompt]} />
          </Field>
        </Panel>

        <Panel title="Réponse attendue">
          {isChoice && (
            <FieldSet>
              <FieldLegend variant="label" className="sr-only">
                Propositions
              </FieldLegend>
              <FieldDescription>
                {type === "SINGLE_CHOICE" ? "Sélectionnez la bonne réponse." : "Cochez toutes les bonnes réponses."}
              </FieldDescription>
              <ul className="space-y-2">
                {options.fields.map((option, index) => (
                  <li key={option.id} className="flex items-start gap-2.5">
                    <Controller
                      control={control}
                      name={`options.${index}.isCorrect`}
                      render={({ field }) => (
                        <input
                          type={type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                          name="correct-option"
                          aria-label={`Proposition ${optionLabel(index)} correcte`}
                          className="mt-2.5 size-4 accent-[var(--success)]"
                          checked={field.value}
                          onChange={(e) => {
                            if (type === "SINGLE_CHOICE") {
                              form.getValues("options").forEach((_, i) =>
                                setValue(`options.${i}.isCorrect`, i === index, { shouldDirty: true }),
                              );
                            } else field.onChange(e.target.checked);
                          }}
                        />
                      )}
                    />
                    <span className="mt-2 w-5 text-sm font-semibold text-muted-foreground">{optionLabel(index)}</span>
                    <div className="flex-1">
                      <Input
                        aria-label={`Texte de la proposition ${optionLabel(index)}`}
                        aria-invalid={Boolean(errors.options?.[index]?.text)}
                        {...register(`options.${index}.text`)}
                      />
                      <FieldError errors={[errors.options?.[index]?.text]} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => options.remove(index)}
                      disabled={options.fields.length <= 2}
                      aria-label={`Supprimer la proposition ${optionLabel(index)}`}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
              <FieldError errors={[errors.options?.root ?? (errors.options as { message?: string } | undefined)]} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => options.append({ text: "", isCorrect: false })}
                  disabled={options.fields.length >= MAX_OPTIONS}
                >
                  <Plus data-icon="inline-start" /> Ajouter une proposition
                </Button>
                {type === "MULTIPLE_CHOICE" && (
                  <SwitchField control={control} name="partialCredit" label="Crédit partiel" />
                )}
              </div>
            </FieldSet>
          )}

          {type === "TRUE_FALSE" && (
            <Controller
              control={control}
              name="trueFalseAnswer"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Bonne réponse" className="flex gap-2">
                  {(["true", "false"] as const).map((v) => (
                    <label
                      key={v}
                      className={cn(
                        "flex-1 cursor-pointer rounded-lg border p-3 text-center text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                        field.value === v ? "border-success bg-success-muted text-success" : "hover:bg-muted/60",
                      )}
                    >
                      <input type="radio" className="sr-only" checked={field.value === v} onChange={() => field.onChange(v)} />
                      {v === "true" ? "Vrai" : "Faux"}
                    </label>
                  ))}
                </div>
              )}
            />
          )}

          {type === "NUMERIC" && (
            <FieldGroup className="grid gap-4 sm:grid-cols-3">
              <TextField label="Valeur exacte" name="numericValue" register={register} errors={errors} placeholder="12,5" inputMode="decimal" />
              <TextField
                label="Tolérance (±)"
                name="numericTolerance"
                register={register}
                errors={errors}
                placeholder="0"
                inputMode="decimal"
              />
              <TextField label="Unité" name="numericUnit" register={register} errors={errors} placeholder="facultatif" />
            </FieldGroup>
          )}

          {type === "TEXT" && (
            <FieldGroup>
              <SwitchField
                control={control}
                name="requiresManualGrading"
                label="Correction manuelle"
                description="Un correcteur de l'organisation note la réponse après la soumission."
              />
              <Field data-invalid={Boolean(errors.acceptedAnswers)}>
                <FieldLabel htmlFor="acceptedAnswers">
                  Réponses acceptées {values.requiresManualGrading && "(facultatif, aide au correcteur)"}
                </FieldLabel>
                <Textarea id="acceptedAnswers" rows={3} aria-invalid={Boolean(errors.acceptedAnswers)} {...register("acceptedAnswers")} />
                <FieldDescription>Une réponse par ligne. Les espaces superflus sont ignorés.</FieldDescription>
                <FieldError errors={[errors.acceptedAnswers]} />
              </Field>
              <SwitchField control={control} name="caseSensitive" label="Respecter les majuscules" />
            </FieldGroup>
          )}

          {type === "FILL_BLANK" && (
            <FieldGroup>
              {blanks.fields.length === 0 && (
                <p className="text-sm text-muted-foreground">Insérez un trou dans l&apos;énoncé pour définir sa réponse.</p>
              )}
              {blanks.fields.map((blank, index) => (
                <TextField
                  key={blank.id}
                  label={`Trou ${index + 1} : réponses acceptées`}
                  name={`blanks.${index}.accepted`}
                  register={register}
                  error={errors.blanks?.[index]?.accepted}
                  description="Séparez les variantes par « ; » (ex. 8 ; huit)."
                />
              ))}
              <FieldError errors={[errors.blanks as { message?: string } | undefined]} />
              <SwitchField control={control} name="caseSensitive" label="Respecter les majuscules" />
            </FieldGroup>
          )}
        </Panel>

        <Panel title="Classement et barème">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="categoryId">Catégorie</FieldLabel>
              <NativeSelect id="categoryId" {...register("categoryId")}>
                <option value="">Sans catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="difficulty">Difficulté</FieldLabel>
              <NativeSelect id="difficulty" {...register("difficulty")}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {difficultyLabels[d]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <TextField
              label="Barème par défaut (points)"
              name="defaultPoints"
              register={register}
              errors={errors}
              inputMode="decimal"
              description="Modifiable dans chaque épreuve."
            />
            <TextField
              label="Temps conseillé (secondes)"
              name="recommendedSeconds"
              register={register}
              errors={errors}
              inputMode="numeric"
              placeholder="facultatif"
            />
          </FieldGroup>
        </Panel>

        <Panel title="Image et document">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">Image</p>
              <FileField bank={bank} kind="image" value={media.image} onChange={(f) => setFile("image", f)} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Document joint</p>
              <FileField bank={bank} kind="attachment" value={media.attachment} onChange={(f) => setFile("attachment", f)} />
            </div>
          </div>
        </Panel>

        <Panel title="Correction pédagogique" description="Affichée au candidat avec la correction, selon les règles de l'évaluation.">
          <FieldGroup>
            <AreaField label="Explication" name="explanation" register={register} errors={errors} />
            <div className="grid gap-4 sm:grid-cols-2">
              <AreaField label="Méthode classique" name="classicMethod" register={register} errors={errors} />
              <AreaField label="Méthode rapide" name="quickMethod" register={register} errors={errors} />
              <AreaField label="Astuce" name="tip" register={register} errors={errors} />
              <AreaField label="Erreurs fréquentes" name="commonMistakes" register={register} errors={errors} />
            </div>
          </FieldGroup>
        </Panel>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t bg-background px-4 py-3 sm:mx-0 sm:rounded-lg sm:border">
          <Button type="button" variant="outline" size="lg" disabled={pending} onClick={() => submit("DRAFT")}>
            {labels.draft}
          </Button>
          <Button type="button" size="lg" disabled={pending} onClick={() => submit("PUBLISHED")}>
            {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
            {labels.publish}
          </Button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6">
        <QuestionPreview values={values} media={previewMedia} />
      </aside>
    </div>
  );
}

function firstErrorMessage(errors: FieldErrors<QuestionEditorValues>): string {
  const count = Object.keys(errors).length;
  return count > 0 ? "Certains champs sont à corriger : ils sont signalés en rouge." : "Formulaire invalide.";
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

type Register = ReturnType<typeof useForm<QuestionEditorValues>>["register"];
type FieldName = Parameters<Register>[0];

function TextField({
  label,
  name,
  register,
  errors,
  error,
  description,
  ...input
}: {
  label: string;
  name: FieldName;
  register: Register;
  errors?: FieldErrors<QuestionEditorValues>;
  error?: { message?: string };
  description?: string;
} & Pick<React.ComponentProps<"input">, "placeholder" | "inputMode">) {
  const fieldError = error ?? (errors?.[name as keyof QuestionEditorValues] as { message?: string } | undefined);
  return (
    <Field data-invalid={Boolean(fieldError)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input id={name} aria-invalid={Boolean(fieldError)} {...input} {...register(name)} />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[fieldError]} />
    </Field>
  );
}

function AreaField({
  label,
  name,
  register,
  errors,
}: {
  label: string;
  name: "explanation" | "classicMethod" | "quickMethod" | "tip" | "commonMistakes";
  register: Register;
  errors: FieldErrors<QuestionEditorValues>;
}) {
  return (
    <Field data-invalid={Boolean(errors[name])}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Textarea id={name} rows={3} aria-invalid={Boolean(errors[name])} {...register(name)} />
      <FieldError errors={[errors[name]]} />
    </Field>
  );
}

function SwitchField({
  control,
  name,
  label,
  description,
}: {
  control: ReturnType<typeof useForm<QuestionEditorValues>>["control"];
  name: "partialCredit" | "caseSensitive" | "requiresManualGrading";
  label: string;
  description?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex cursor-pointer items-start gap-3">
          <Switch checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
          <span>
            <span className="text-sm font-medium">{label}</span>
            {description && <span className="block text-sm text-muted-foreground">{description}</span>}
          </span>
        </label>
      )}
    />
  );
}
