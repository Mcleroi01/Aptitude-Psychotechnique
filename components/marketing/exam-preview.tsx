import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const answered = new Set([1, 2, 3, 5, 6]);
const current = 7;

/**
 * Illustration statique de l'interface du simulateur (non interactive).
 * La question est un exemple original.
 */
export function ExamPreview({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white p-5 text-foreground shadow-2xl shadow-black/30 sm:p-6",
        className,
      )}
      aria-label="Aperçu de l'interface du simulateur d'examen"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Examen blanc</p>
          <p className="font-heading text-sm font-bold text-primary">Question 7 sur 15</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-sm font-semibold text-primary tabular">
          <Clock className="size-4 text-brand-sky" aria-hidden />
          09:42
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[35%] rounded-full bg-brand-sky" />
      </div>

      <p className="mt-5 text-[0.95rem] font-medium leading-relaxed">
        Un article de 48 000 FC baisse de 25 %. Quel est son nouveau prix ?
      </p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          ["A", "34 000 FC"],
          ["B", "36 000 FC"],
          ["C", "38 000 FC"],
          ["D", "40 000 FC"],
        ].map(([label, text]) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
              label === "B" ? "border-brand-sky bg-accent/60 font-semibold text-primary" : "border-border",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-xs font-bold",
                label === "B" ? "bg-primary text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {label}
            </span>
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-8 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {Array.from({ length: 15 }, (_, index) => index + 1).map((n) => (
          <span
            key={n}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md text-[0.65rem] font-semibold tabular",
              n === current && "bg-primary text-white ring-2 ring-brand-sky ring-offset-1",
              n !== current && answered.has(n) && "bg-success-muted text-success",
              n !== current && !answered.has(n) && "bg-muted text-muted-foreground",
            )}
          >
            {n}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">
        Illustration : chronomètre, question à choix multiples et grille de navigation des 15 questions.
      </figcaption>
    </figure>
  );
}
