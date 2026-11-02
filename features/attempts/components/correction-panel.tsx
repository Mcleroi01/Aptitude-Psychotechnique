import { Badge } from "@/components/ui/badge";
import { formatPoints } from "@/lib/assessments/labels";
import type { Correction } from "@/lib/questions/correction";
import type { GradeStatus } from "@/lib/questions/grading";

export const gradeLabels: Record<GradeStatus, { text: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  correct: { text: "Bonne réponse", variant: "success" },
  partial: { text: "Partiellement juste", variant: "warning" },
  incorrect: { text: "Réponse incorrecte", variant: "destructive" },
  unanswered: { text: "Sans réponse", variant: "secondary" },
  pending_review: { text: "En attente de correction", variant: "secondary" },
};

/** Correction détaillée d'une question (entraînement ou résultats complets). */
export function CorrectionPanel({ correction, points, feedback }: { correction: Correction; points?: number; feedback?: string | null }) {
  const label = gradeLabels[correction.status];
  const blocks = [
    ["Explication", correction.explanation],
    ["Méthode classique", correction.classicMethod],
    ["Méthode rapide", correction.quickMethod],
    ["Astuce", correction.tip],
    ["Erreurs fréquentes", correction.commonMistakes],
  ].filter((b): b is [string, string] => Boolean(b[1]));

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm" aria-live="polite">
      <p className="flex flex-wrap items-center gap-2">
        <Badge variant={label.variant}>{label.text}</Badge>
        {correction.score !== null && points !== undefined && (
          <span className="text-muted-foreground tabular">
            {formatPoints(correction.score)} / {formatPoints(points)}
          </span>
        )}
      </p>
      {correction.expected && (
        <p>
          <span className="font-medium">Réponse attendue : </span>
          {correction.expected}
        </p>
      )}
      {feedback && (
        <p>
          <span className="font-medium">Commentaire du correcteur : </span>
          {feedback}
        </p>
      )}
      {blocks.length > 0 && (
        <dl className="space-y-2.5 border-t pt-3">
          {blocks.map(([title, text]) => (
            <div key={title}>
              <dt className="font-medium">{title}</dt>
              <dd className="mt-0.5 whitespace-pre-line text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
