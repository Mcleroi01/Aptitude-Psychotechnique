import { Lightbulb, TriangleAlert, Turtle, Zap } from "lucide-react";

/** Démonstration pédagogique : méthode classique contre méthode rapide. */
export function MethodShowcase() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="border-b bg-secondary/60 px-5 py-4 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-sky">Exemple · Pourcentages</p>
        <p className="mt-1 font-heading text-lg font-bold text-primary">
          Un article de 48 000 FC baisse de 25 %. Quel est son nouveau prix ?
        </p>
      </div>
      <div className="grid md:grid-cols-2">
        <div className="border-b p-5 sm:p-7 md:border-r md:border-b-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Turtle className="size-4" aria-hidden /> Méthode classique · ~50 s
          </div>
          <ol className="mt-4 space-y-2 font-mono text-sm tabular">
            <li>48 000 × 25 = 1 200 000</li>
            <li>1 200 000 ÷ 100 = 12 000</li>
            <li>48 000 − 12 000 = 36 000</li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">Trois opérations, et autant d&apos;occasions de se tromper.</p>
        </div>
        <div className="bg-success-muted/40 p-5 sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <Zap className="size-4" aria-hidden /> Méthode rapide · ~15 s
          </div>
          <ol className="mt-4 space-y-2 font-mono text-sm tabular">
            <li>−25 % = on garde les 3/4</li>
            <li>48 000 ÷ 4 = 12 000</li>
            <li>12 000 × 3 = 36 000 ✓</li>
          </ol>
          <p className="mt-4 text-sm text-foreground/80">
            Un pourcentage simple se transforme en fraction : 25 % = 1/4, 20 % = 1/5, 50 % = 1/2.
          </p>
        </div>
      </div>
      <div className="grid gap-px border-t bg-border sm:grid-cols-2">
        <div className="flex gap-3 bg-card p-5 sm:px-7">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <p className="text-sm">
            <span className="font-semibold">Astuce : </span>
            vérifiez l&apos;ordre de grandeur. Une baisse de 25 % donne forcément un prix entre 30 000 et 40 000.
          </p>
        </div>
        <div className="flex gap-3 bg-card p-5 sm:px-7">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <p className="text-sm">
            <span className="font-semibold">Erreur fréquente : </span>
            répondre 12 000, c&apos;est-à-dire le montant de la baisse au lieu du nouveau prix.
          </p>
        </div>
      </div>
    </div>
  );
}
