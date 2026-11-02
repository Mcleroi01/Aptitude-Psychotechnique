/**
 * Reproductions statiques de l'interface, utilisées comme illustrations
 * sur les pages publiques. Aucun élément n'est interactif ; les questions
 * sont des exemples originaux.
 */
import { Check, ChevronLeft, ChevronRight, Clock, Flag, X } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const answered = new Set([1, 2, 3, 4, 5, 6, 8]);

export function ExamScreen() {
  return (
    <div className="text-[0.6rem] text-foreground sm:text-[0.7rem]">
      <div className="flex items-center justify-between bg-ink px-[3%] py-[1.6%] text-white">
        <div className="flex items-center gap-1.5">
          <LogoMark inverted className="size-3.5 sm:size-4" />
          <span className="font-heading font-semibold">Examen blanc</span>
          <span className="hidden text-white/50 sm:inline">· Format standard</span>
        </div>
        <span className="flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 font-mono font-semibold tabular">
          <Clock className="size-2.5 sm:size-3" /> 08:36
        </span>
      </div>

      <div className="flex gap-[0.6%] border-b px-[3%] py-[1.6%]">
        {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
          <span
            key={n}
            className={cn(
              "flex aspect-square flex-1 items-center justify-center rounded-[3px] font-semibold tabular",
              n === 9 && "bg-primary text-white",
              n !== 9 && answered.has(n) && "bg-accent text-primary",
              n !== 9 && !answered.has(n) && "border text-muted-foreground",
            )}
          >
            {n}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[1.25fr_1fr] gap-[3%] px-[3%] py-[3%]">
        <div>
          <p className="font-semibold text-muted-foreground">Question 9 · Suites numériques</p>
          <p className="mt-1.5 text-[0.7rem] font-medium leading-snug sm:text-[0.85rem]">
            Quel nombre complète la suite ?
          </p>
          <div className="mt-[6%] flex flex-wrap gap-1 font-mono text-[0.75rem] font-semibold sm:text-[0.95rem]">
            {["5", "9", "17", "33", "65", "?"].map((n, i) => (
              <span
                key={i}
                className={cn(
                  "rounded border px-1.5 py-1 tabular",
                  n === "?" ? "border-dashed border-primary text-primary" : "bg-secondary",
                )}
              >
                {n}
              </span>
            ))}
          </div>
          <div className="mt-[6%] flex items-end gap-[3%]">
            {[22, 30, 46, 70, 100].map((h, i) => (
              <span key={i} className="flex-1 rounded-t-[2px] bg-accent" style={{ height: `${h * 0.42}px` }} />
            ))}
            <span className="h-[46px] flex-1 rounded-t-[2px] border border-dashed border-primary/60" />
          </div>
        </div>
        <div className="space-y-[4%]">
          {[
            ["A", "97"],
            ["B", "129"],
            ["C", "130"],
            ["D", "131"],
            ["E", "113"],
          ].map(([label, value]) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 rounded border px-1.5 py-[3%]",
                label === "B" && "border-primary bg-accent/70 font-semibold",
              )}
            >
              <span
                className={cn(
                  "flex size-3.5 items-center justify-center rounded-[3px] text-[0.55rem] font-bold sm:size-4",
                  label === "B" ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {label}
              </span>
              <span className="tabular">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-[3%] py-[1.8%] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <ChevronLeft className="size-3" /> Précédente
        </span>
        <span className="flex items-center gap-1">
          <Flag className="size-2.5" /> Passer
        </span>
        <span className="flex items-center gap-0.5 rounded bg-primary px-2 py-1 font-semibold text-white">
          Suivante <ChevronRight className="size-3" />
        </span>
      </div>
    </div>
  );
}

function ScoreRing({ percent, size = 96 }: { percent: number; size?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
      <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-muted" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
        className="stroke-success"
      />
    </svg>
  );
}

export function PhoneResults() {
  return (
    <div className="px-3.5 pt-8 pb-5 text-[0.62rem]">
      <p className="font-heading text-[0.8rem] font-semibold">Résultat</p>
      <p className="text-muted-foreground">Examen blanc · 15 questions</p>
      <div className="relative mx-auto mt-3 w-fit">
        <ScoreRing percent={80} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-lg leading-none font-semibold tabular">12/15</span>
          <span className="text-muted-foreground">80 %</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
        {[
          ["12", "justes", "text-success"],
          ["2", "fausses", "text-destructive"],
          ["1", "sans rép.", "text-muted-foreground"],
        ].map(([value, label, color]) => (
          <div key={label} className="rounded-md bg-secondary py-1.5">
            <p className={cn("font-heading text-sm font-semibold tabular", color)}>{value}</p>
            <p className="text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between rounded-md border px-2 py-1.5">
        <span className="text-muted-foreground">Temps moyen</span>
        <span className="font-semibold tabular">53 s / question</span>
      </div>
    </div>
  );
}

/** Correction détaillée : réponse donnée, bonne réponse, étapes et méthode rapide. */
export function ReviewCard() {
  return (
    <div className="rounded-xl border bg-card p-5 text-sm shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <span className="font-heading font-semibold">Question 4</span>
        <span className="rounded bg-accent px-1.5 py-0.5 text-[0.7rem] font-medium text-primary">Correction</span>
      </div>
      <p className="mt-2 text-muted-foreground">
        Un salaire de 250 000 FC augmente de 8 %. Quel est le nouveau salaire ?
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-1 text-destructive">
          <X className="size-3.5" /> <span className="font-semibold tabular">258 000</span>
          <span className="text-xs">Votre réponse</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success-muted px-2.5 py-1 text-success">
          <Check className="size-3.5" /> <span className="font-semibold tabular">270 000</span>
          <span className="text-xs">Bonne réponse</span>
        </span>
      </div>
      <p className="mt-5 text-xs font-semibold text-foreground">Solution</p>
      <ol className="mt-2 space-y-2.5">
        {[
          ["Calculer 1 %", "250 000 ÷ 100 = 2 500"],
          ["En déduire 8 %", "2 500 × 8 = 20 000"],
          ["Ajouter l'augmentation", "250 000 + 20 000 = 270 000"],
        ].map(([label, math], index) => (
          <li key={label} className="flex gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/30 text-[0.7rem] font-semibold text-primary tabular">
              {index + 1}
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-mono text-[0.8rem] font-medium tabular">{math}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-md bg-secondary px-3 py-2 text-xs">
        <span className="font-semibold">Méthode rapide : </span>
        multipliez par 1,08 → 250 000 + 8 × 2 500 = 270 000.
      </div>
    </div>
  );
}

/** Bilan d'examen par catégorie. */
export function ReportCard() {
  const rows = [
    ["Suites numériques", 100],
    ["Pourcentages", 67],
    ["Proportions", 100],
    ["Problèmes", 50],
  ] as const;
  return (
    <div className="rounded-xl border bg-card p-5 text-sm shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-4" />
        </span>
        <div>
          <p className="font-heading font-semibold">Bon résultat</p>
          <p className="text-xs text-muted-foreground">Examen blanc terminé en 13 min 20</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular">12/15</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Temps moyen</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular">53 s</p>
        </div>
      </div>
      <p className="mt-5 text-xs font-semibold">Réussite par catégorie</p>
      <ul className="mt-3 space-y-2.5">
        {rows.map(([label, value]) => (
          <li key={label}>
            <div className="flex justify-between text-xs">
              <span>{label}</span>
              <span className="font-semibold tabular">{value} %</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", value >= 70 ? "bg-success" : "bg-warning")}
                style={{ width: `${value}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Choix d'une série d'entraînement. */
export function PracticeSetupCard() {
  return (
    <div className="rounded-xl border bg-card p-5 text-sm shadow-sm sm:p-6">
      <p className="font-heading font-semibold">Nouvel entraînement</p>
      <p className="mt-4 text-xs font-medium text-muted-foreground">Catégorie</p>
      <div className="mt-1.5 flex items-center justify-between rounded-md border px-3 py-2">
        Proportions et règle de trois <ChevronRight className="size-4 rotate-90 text-muted-foreground" />
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">Niveau</p>
      <div className="mt-1.5 grid grid-cols-3 rounded-md border p-0.5 text-center text-xs">
        <span className="py-1.5 text-muted-foreground">Facile</span>
        <span className="rounded bg-primary py-1.5 font-semibold text-white">Intermédiaire</span>
        <span className="py-1.5 text-muted-foreground">Difficile</span>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">Nombre de questions</p>
      <div className="mt-1.5 flex gap-1.5">
        {[5, 10, 15, 20].map((n) => (
          <span
            key={n}
            className={cn(
              "flex-1 rounded-md border py-1.5 text-center text-xs tabular",
              n === 10 && "border-primary bg-accent font-semibold text-primary",
            )}
          >
            {n}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> Objectif : 45 s par question
        </span>
        <span className="rounded-md bg-primary px-3 py-1.5 font-semibold text-white">Commencer</span>
      </div>
    </div>
  );
}
