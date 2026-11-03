import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "@/components/shared/icon-tile";
import { cn } from "@/lib/utils";

/** Ligne de fonctionnalité : illustration encadrée (légère parallaxe) d'un côté, explication de l'autre. */
export function FeatureRow({
  icon,
  title,
  children,
  visual,
  reverse = false,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <div className={cn("relative", reverse && "lg:order-2")}>
        {/* Cadre : bordure en dégradé et grille d'arrière-plan */}
        <div className="rounded-[1.25rem] bg-gradient-to-br from-brand-sky/60 via-border to-primary/30 p-px shadow-xl shadow-primary/5">
          <div className="relative overflow-hidden rounded-[calc(1.25rem-1px)] bg-secondary/70 p-4 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--secondary)_80%)]" />
            <div data-parallax="0.12" className="relative">
              {visual}
            </div>
          </div>
        </div>
      </div>
      <div data-reveal className="max-w-md">
        <IconTile icon={icon} />
        <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
