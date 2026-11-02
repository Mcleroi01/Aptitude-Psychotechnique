"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CloudOff, Flag, ListChecks, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  checkPracticeAnswerAction,
  getAttemptViewAction,
  saveAnswerAction,
  startSectionAction,
  submitSectionAction,
} from "@/features/attempts/actions";
import { CorrectionPanel } from "@/features/attempts/components/correction-panel";
import { Countdown } from "@/features/attempts/components/countdown";
import { QuestionView } from "@/features/questions/components/question-view";
import { formatDuration, formatPoints, navigationModeLabels } from "@/lib/assessments/labels";
import type { ActionResult } from "@/lib/errors";
import type { QuestionResponse } from "@/lib/questions/answer-key";
import type { Correction } from "@/lib/questions/correction";
import { cn } from "@/lib/utils";
import type { AttemptView } from "@/services/attempt-view.service";

type ItemState = { response: QuestionResponse | null; draft?: string; flagged: boolean; correction: Correction | null; dirty: boolean };
type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY_MS = 700;

export function AttemptPlayer({ initial }: { initial: AttemptView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [offsetMs, setOffsetMs] = useState(() => new Date(initial.serverNow).getTime() - Date.now());
  const [busy, startBusy] = useTransition();

  /** Applique un nouvel état serveur et recale l'horloge. */
  const apply = useCallback(
    (next: AttemptView) => {
      setOffsetMs(new Date(next.serverNow).getTime() - Date.now());
      setView(next);
      if (next.status !== "IN_PROGRESS") router.replace(`/tentative/${next.id}/resultat`);
    },
    [router],
  );

  const call = useCallback(
    (action: () => Promise<ActionResult<AttemptView>>) =>
      new Promise<void>((resolve) =>
        startBusy(async () => {
          const result = await action();
          if (result.ok) apply(result.data);
          else toast.error(result.error.message);
          resolve();
        }),
      ),
    [apply],
  );

  const refresh = useCallback(() => call(() => getAttemptViewAction(view.id)), [call, view.id]);

  const section = view.sections.find((s) => s.id === view.currentSectionId) ?? null;
  const sectionIndex = section ? view.sections.indexOf(section) : -1;

  if (view.status !== "IN_PROGRESS") {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden /> Tentative terminée, ouverture des résultats…
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{view.title}</p>
          {section && view.sections.length > 1 && (
            <p className="text-sm font-medium">
              Épreuve {sectionIndex + 1} / {view.sections.length} · {section.title}
            </p>
          )}
        </div>
        {view.deadline && (section?.status === "IN_PROGRESS" || view.timingMode === "GLOBAL") && (
          <Countdown deadline={view.deadline} offsetMs={offsetMs} onExpire={refresh} />
        )}
      </div>

      {section?.status === "NOT_STARTED" && (
        <SectionIntro
          view={view}
          sectionIndex={sectionIndex}
          busy={busy}
          onStart={() => call(() => startSectionAction(view.id))}
        />
      )}

      {section?.status === "IN_PROGRESS" && (
        <SectionRunner key={section.id} view={view} busy={busy} onRefresh={refresh} onSubmit={() => call(() => submitSectionAction(view.id))} />
      )}
    </div>
  );
}

function SectionIntro({ view, sectionIndex, busy, onStart }: { view: AttemptView; sectionIndex: number; busy: boolean; onStart: () => void }) {
  const section = view.sections[sectionIndex];
  const first = sectionIndex === 0;
  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8">
      {first && view.instructions && (
        <div className="mb-6 border-b pb-6">
          <h1 className="text-2xl font-semibold">{view.title}</h1>
          <p className="mt-3 whitespace-pre-line text-muted-foreground">{view.instructions}</p>
        </div>
      )}
      <p className="text-sm font-medium text-muted-foreground">
        {view.sections.length > 1 ? `Épreuve ${sectionIndex + 1} sur ${view.sections.length}` : "Épreuve"}
      </p>
      <h2 className="mt-1 text-2xl font-semibold">{section.title}</h2>
      {section.instructions && <p className="mt-3 whitespace-pre-line text-muted-foreground">{section.instructions}</p>}
      <ul className="mt-5 space-y-1.5 text-sm">
        <li>{section.questionCount} question(s)</li>
        {section.durationSeconds ? (
          <li>Durée de l&apos;épreuve : {formatDuration(section.durationSeconds)}. Le chronomètre démarre quand vous commencez.</li>
        ) : view.timingMode === "GLOBAL" ? (
          <li>Le chronomètre global continue de tourner.</li>
        ) : null}
        <li>{navigationModeLabels[section.navigationMode]}</li>
        <li>Vos réponses sont enregistrées automatiquement ; à la fin du temps, elles sont soumises d&apos;office.</li>
      </ul>
      <Button className="mt-6" size="xl" onClick={onStart} disabled={busy}>
        {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Commencer l&apos;épreuve <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}

function SectionRunner({
  view,
  busy,
  onRefresh,
  onSubmit,
}: {
  view: AttemptView;
  busy: boolean;
  onRefresh: () => Promise<void>;
  onSubmit: () => Promise<void>;
}) {
  const section = view.sections.find((s) => s.id === view.currentSectionId)!;
  const practice = view.mode === "PRACTICE";
  const forwardOnly = section.navigationMode === "FORWARD_ONLY";
  const items = view.items;

  const [states, setStates] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(items.map((i) => [i.answerId, { response: i.response, flagged: i.flagged, correction: i.correction, dirty: false }])),
  );
  // Reprise : on repart de la première question sans réponse.
  const [index, setIndex] = useState(() => {
    const firstOpen = items.findIndex((i) => !i.response);
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [reviewing, setReviewing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [checking, startChecking] = useTransition();

  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  }, [states]);
  const enteredAt = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    enteredAt.current = Date.now();
  }, [index]);

  const current = items[index];

  /** Enregistre une question ; le temps passé est compté si c'est la question affichée. */
  const save = useCallback(
    async (answerId: string, options: { countTime?: boolean } = {}) => {
      clearTimeout(timers.current[answerId]);
      const state = statesRef.current[answerId];
      if (!state) return true;
      const timeSpentMs = options.countTime ? Date.now() - enteredAt.current : 0;
      if (options.countTime) enteredAt.current = Date.now();
      if (!state.dirty && timeSpentMs === 0) return true;
      setSaveStatus("saving");
      const result = await saveAnswerAction(view.id, { answerId, response: state.response, flagged: state.flagged, timeSpentMs });
      if (!result.ok) {
        setSaveStatus("error");
        if (result.error.code === "CONFLICT") {
          toast.error(result.error.message);
          await onRefresh();
        }
        return false;
      }
      setStates((all) => ({ ...all, [answerId]: { ...all[answerId], dirty: false } }));
      setSaveStatus("saved");
      return true;
    },
    [view.id, onRefresh],
  );

  const update = (answerId: string, patch: Partial<ItemState>) => {
    setStates((all) => ({ ...all, [answerId]: { ...all[answerId], ...patch, dirty: true } }));
    clearTimeout(timers.current[answerId]);
    timers.current[answerId] = setTimeout(() => void save(answerId), SAVE_DELAY_MS);
  };

  const flushAll = useCallback(async () => {
    const pending = Object.entries(statesRef.current).filter(([, s]) => s.dirty);
    const results = await Promise.all(pending.map(([answerId]) => save(answerId)));
    return results.every(Boolean);
  }, [save]);

  const go = async (next: number) => {
    await save(current.answerId, { countTime: true });
    setReviewing(false);
    setIndex(next);
  };

  // Retour sur l'onglet ou reconnexion : enregistrer puis se recaler sur le serveur.
  useEffect(() => {
    const resync = () => {
      if (document.visibilityState === "visible") void flushAll().then(onRefresh);
    };
    const warn = (event: BeforeUnloadEvent) => {
      if (Object.values(statesRef.current).some((s) => s.dirty)) event.preventDefault();
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("online", resync);
    window.addEventListener("beforeunload", warn);
    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("online", resync);
      window.removeEventListener("beforeunload", warn);
    };
  }, [flushAll, onRefresh]);

  const unanswered = useMemo(() => items.filter((i) => !states[i.answerId]?.response).length, [items, states]);
  const flaggedCount = useMemo(() => items.filter((i) => states[i.answerId]?.flagged).length, [items, states]);
  const last = index === items.length - 1;

  const finish = async () => {
    await save(current.answerId, { countTime: true });
    if (!(await flushAll())) {
      toast.error("Certaines réponses n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez.");
      return;
    }
    const message =
      unanswered > 0
        ? `${unanswered} question(s) sans réponse. Terminer l'épreuve quand même ? Vous ne pourrez plus modifier vos réponses.`
        : "Terminer l'épreuve ? Vous ne pourrez plus modifier vos réponses.";
    if (window.confirm(message)) await onSubmit();
  };

  const check = () =>
    startChecking(async () => {
      if (!(await save(current.answerId))) return;
      const result = await checkPracticeAnswerAction(view.id, current.answerId);
      if (!result.ok) return void toast.error(result.error.message);
      setStates((all) => ({ ...all, [current.answerId]: { ...all[current.answerId], correction: result.data, dirty: false } }));
    });

  if (!current) return <p className="text-muted-foreground">Cette épreuve ne contient aucune question.</p>;
  const state = states[current.answerId];

  if (reviewing) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Relecture</h2>
        <p className="mt-1 text-sm text-muted-foreground tabular">
          {items.length - unanswered} / {items.length} réponse(s) · {flaggedCount} question(s) marquée(s)
        </p>
        <ol className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8">
          {items.map((item, i) => (
            <li key={item.answerId}>
              <button
                onClick={() => void go(i)}
                className={cn(
                  "relative flex h-11 w-full items-center justify-center rounded-md border text-sm font-medium tabular",
                  states[item.answerId]?.response ? "bg-primary/10" : "bg-background",
                )}
              >
                {i + 1}
                {states[item.answerId]?.flagged && <Flag className="absolute top-1 right-1 size-3 text-warning" aria-label="Marquée" />}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <Button variant="outline" onClick={() => setReviewing(false)}>
            <ArrowLeft data-icon="inline-start" /> Revenir aux questions
          </Button>
          <Button onClick={finish} disabled={busy}>
            {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Terminer l&apos;épreuve
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3 text-sm">
        <span className="font-medium tabular">
          Question {index + 1} / {items.length}
        </span>
        <span className="flex items-center gap-2">
          <SaveIndicator status={saveStatus} onRetry={() => void flushAll()} />
          <Badge variant="secondary">{formatPoints(current.points)}</Badge>
        </span>
      </header>

      {!forwardOnly && (
        <nav aria-label="Questions de l'épreuve" className="flex flex-wrap gap-1.5 border-b px-5 py-3">
          {items.map((item, i) => (
            <button
              key={item.answerId}
              onClick={() => void go(i)}
              aria-current={i === index ? "step" : undefined}
              aria-label={`Question ${i + 1}${states[item.answerId]?.response ? ", répondue" : ""}${states[item.answerId]?.flagged ? ", marquée" : ""}`}
              className={cn(
                "relative size-8 rounded-md border text-xs font-medium tabular",
                i === index
                  ? "border-primary bg-primary text-primary-foreground"
                  : states[item.answerId]?.response
                    ? "bg-primary/10"
                    : "bg-background hover:bg-muted",
              )}
            >
              {i + 1}
              {states[item.answerId]?.flagged && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-warning" aria-hidden />}
            </button>
          ))}
        </nav>
      )}

      <div className="space-y-5 p-5 sm:p-6">
        <QuestionView
          key={current.answerId}
          question={current.question}
          response={state.response}
          disabled={Boolean(state.correction)}
          feedback={state.correction ? { correctLabels: state.correction.correctLabels } : null}
          onChange={(response) => update(current.answerId, { response })}
          numericDraft={state.draft}
          onNumericDraftChange={(draft) => setStates((all) => ({ ...all, [current.answerId]: { ...all[current.answerId], draft } }))}
        />
        {practice && state.correction && <CorrectionPanel correction={state.correction} points={current.points} />}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
        <div className="flex gap-2">
          {!forwardOnly && (
            <Button variant="outline" disabled={index === 0} onClick={() => void go(index - 1)}>
              <ArrowLeft data-icon="inline-start" /> Précédente
            </Button>
          )}
          {!practice && (
            <Button
              variant="ghost"
              aria-pressed={state.flagged}
              onClick={() => update(current.answerId, { flagged: !state.flagged })}
            >
              <Flag className={cn(state.flagged && "fill-warning text-warning")} data-icon="inline-start" />
              {state.flagged ? "Marquée" : "Marquer"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {practice && !state.correction && (
            <Button variant="outline" onClick={check} disabled={checking || !state.response}>
              {checking ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
              Vérifier
            </Button>
          )}
          {!last ? (
            <Button onClick={() => void go(index + 1)}>
              Suivante <ArrowRight data-icon="inline-end" />
            </Button>
          ) : section.allowReview && !forwardOnly && !practice ? (
            <Button
              onClick={async () => {
                await save(current.answerId, { countTime: true });
                setReviewing(true);
              }}
            >
              <ListChecks data-icon="inline-start" /> Relire et terminer
            </Button>
          ) : (
            <Button onClick={finish} disabled={busy}>
              {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {practice ? "Terminer l'entraînement" : "Terminer l'épreuve"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "idle") return null;
  if (status === "error") {
    return (
      <button onClick={onRetry} className="inline-flex items-center gap-1 text-xs text-destructive hover:underline">
        <CloudOff className="size-3.5" aria-hidden /> Non enregistré · réessayer
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
      {status === "saving" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
      {status === "saving" ? "Enregistrement…" : "Enregistré"}
    </span>
  );
}
