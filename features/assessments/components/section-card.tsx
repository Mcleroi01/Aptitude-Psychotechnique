"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteSectionAction, moveSectionAction, updateSectionAction } from "@/features/assessments/actions";
import { toNumberOrNull } from "@/features/assessments/components/assessment-settings-form";
import { DrawRulesEditor } from "@/features/assessments/components/draw-rules-editor";
import { SectionQuestions } from "@/features/assessments/components/section-questions";
import type { BankRef } from "@/features/questions/bank";
import {
  formatDuration,
  formatPoints,
  NAVIGATION_MODES,
  navigationModeLabels,
  SELECTION_MODES,
  selectionModeLabels,
} from "@/lib/assessments/labels";
import { sectionMaxScore, sectionQuestionCount } from "@/lib/assessments/validation";
import { useMutation } from "@/lib/use-mutation";
import { cn } from "@/lib/utils";
import type { AssessmentDetail } from "@/services/assessment.service";
import type { TimingMode } from "@/generated/prisma/enums";

export type BuilderSection = AssessmentDetail["sections"][number];

type Props = {
  bank: BankRef;
  assessmentId: string;
  section: BuilderSection;
  index: number;
  total: number;
  timingMode: TimingMode;
  categories: { id: string; name: string }[];
  locked: boolean;
  issues: string[];
};

export function SectionCard({ bank, assessmentId, section, index, total, timingMode, categories, locked, issues }: Props) {
  const { run, pending } = useMutation();
  const [open, setOpen] = useState(false);
  const scoring = {
    selectionMode: section.selectionMode,
    questions: section.questions.map((q) => ({ status: q.question.status, isLatest: q.question.isLatest, points: q.points })),
    drawRules: section.drawRules,
  };

  return (
    <section className={cn("rounded-xl border bg-card", issues.length > 0 && "border-warning/50")}>
      <header className="flex flex-wrap items-start gap-3 border-b p-4 sm:p-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-sm font-semibold tabular">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold">{section.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground tabular">
            {sectionQuestionCount(scoring)} question(s) · {formatPoints(sectionMaxScore(scoring))}
            {timingMode === "PER_SECTION" && ` · ${formatDuration(section.durationSeconds)}`}
            {" · "}
            {selectionModeLabels[section.selectionMode].label}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Monter l'épreuve"
            disabled={locked || pending || index === 0}
            onClick={() => run(() => moveSectionAction(bank, assessmentId, section.id, "up"))}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Descendre l'épreuve"
            disabled={locked || pending || index === total - 1}
            onClick={() => run(() => moveSectionAction(bank, assessmentId, section.id, "down"))}
          >
            <ArrowDown />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <Settings2 data-icon="inline-start" /> Réglages
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} data-icon="inline-end" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Supprimer l'épreuve"
            disabled={locked || pending || total <= 1}
            onClick={() => {
              if (window.confirm(`Supprimer l'épreuve « ${section.title} » et sa sélection de questions ?`)) {
                void run(() => deleteSectionAction(bank, assessmentId, section.id), { success: "Épreuve supprimée." });
              }
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </header>

      {issues.length > 0 && (
        <ul className="space-y-1 border-b bg-warning/10 px-5 py-3 text-sm">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      {open && (
        <div className="border-b bg-muted/30 p-4 sm:p-5">
          <SectionSettings bank={bank} assessmentId={assessmentId} section={section} timingMode={timingMode} locked={locked} />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {section.selectionMode === "FIXED" ? (
          <SectionQuestions bank={bank} assessmentId={assessmentId} section={section} locked={locked} />
        ) : (
          <DrawRulesEditor
            key={JSON.stringify(section.drawRules)}
            bank={bank}
            assessmentId={assessmentId}
            sectionId={section.id}
            rules={section.drawRules}
            categories={categories}
            locked={locked}
          />
        )}
      </div>
    </section>
  );
}

function SectionSettings({
  bank,
  assessmentId,
  section,
  timingMode,
  locked,
}: {
  bank: BankRef;
  assessmentId: string;
  section: BuilderSection;
  timingMode: TimingMode;
  locked: boolean;
}) {
  const { run, pending } = useMutation();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [v, setV] = useState({
    title: section.title,
    description: section.description ?? "",
    instructions: section.instructions ?? "",
    durationMinutes: section.durationSeconds ? String(section.durationSeconds / 60) : "",
    passingPercent: section.passingPercent?.toString() ?? "",
    navigationMode: section.navigationMode,
    allowReview: section.allowReview,
    shuffleQuestions: section.shuffleQuestions,
    selectionMode: section.selectionMode,
  });
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [key]: value }));
  const err = (key: string) => errors[key]?.map((message) => ({ message }));

  const save = () =>
    run(
      () =>
        updateSectionAction(bank, assessmentId, section.id, {
          ...v,
          durationMinutes: toNumberOrNull(v.durationMinutes),
          passingPercent: toNumberOrNull(v.passingPercent),
        }),
      { success: "Épreuve enregistrée.", onError: (r) => setErrors(r.error.fieldErrors ?? { form: [r.error.message] }) },
    ).then((ok) => ok && setErrors({}));

  return (
    <fieldset disabled={locked} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor={`s-title-${section.id}`}>Titre de l&apos;épreuve</FieldLabel>
          <Input id={`s-title-${section.id}`} value={v.title} onChange={(e) => set("title", e.target.value)} />
          <FieldError errors={err("title")} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`s-mode-${section.id}`}>Sélection des questions</FieldLabel>
          <NativeSelect
            id={`s-mode-${section.id}`}
            value={v.selectionMode}
            onChange={(e) => set("selectionMode", e.target.value as typeof v.selectionMode)}
          >
            {SELECTION_MODES.map((m) => (
              <option key={m} value={m}>
                {selectionModeLabels[m].label}
              </option>
            ))}
          </NativeSelect>
          <FieldDescription>{selectionModeLabels[v.selectionMode].hint}</FieldDescription>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor={`s-instr-${section.id}`}>Consignes de l&apos;épreuve</FieldLabel>
        <Textarea id={`s-instr-${section.id}`} rows={2} value={v.instructions} onChange={(e) => set("instructions", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={Boolean(errors.durationMinutes)}>
          <FieldLabel htmlFor={`s-dur-${section.id}`}>Durée (minutes)</FieldLabel>
          <Input
            id={`s-dur-${section.id}`}
            type="number"
            min={1}
            placeholder={timingMode === "PER_SECTION" ? "requise" : "non utilisée"}
            disabled={timingMode !== "PER_SECTION"}
            value={v.durationMinutes}
            onChange={(e) => set("durationMinutes", e.target.value)}
          />
          <FieldError errors={err("durationMinutes")} />
        </Field>
        <Field data-invalid={Boolean(errors.passingPercent)}>
          <FieldLabel htmlFor={`s-pass-${section.id}`}>Seuil de réussite (%)</FieldLabel>
          <Input
            id={`s-pass-${section.id}`}
            type="number"
            min={0}
            max={100}
            placeholder="facultatif"
            value={v.passingPercent}
            onChange={(e) => set("passingPercent", e.target.value)}
          />
          <FieldError errors={err("passingPercent")} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`s-nav-${section.id}`}>Navigation</FieldLabel>
          <NativeSelect
            id={`s-nav-${section.id}`}
            value={v.navigationMode}
            onChange={(e) => set("navigationMode", e.target.value as typeof v.navigationMode)}
          >
            {NAVIGATION_MODES.map((m) => (
              <option key={m} value={m}>
                {navigationModeLabels[m]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 text-sm">
          <Switch
            checked={v.allowReview && v.navigationMode === "FREE"}
            disabled={v.navigationMode !== "FREE"}
            onCheckedChange={(c) => set("allowReview", c)}
          />
          Relecture avant de terminer l&apos;épreuve
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <Switch checked={v.shuffleQuestions} onCheckedChange={(c) => set("shuffleQuestions", c)} />
          Ordre des questions aléatoire
        </label>
      </div>
      {errors.form && <p className="text-sm text-destructive">{errors.form[0]}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending || locked}>
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Enregistrer l&apos;épreuve
        </Button>
        {v.selectionMode !== section.selectionMode && (
          <Badge variant="warning">Le changement de mode s&apos;applique à l&apos;enregistrement</Badge>
        )}
      </div>
    </fieldset>
  );
}
