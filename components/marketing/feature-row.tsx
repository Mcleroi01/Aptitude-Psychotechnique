import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "@/components/shared/icon-tile";
import { cn } from "@/lib/utils";

/** Ligne de fonctionnalité : illustration d'un côté, explication de l'autre. */
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
      <div className={cn("rounded-2xl border bg-secondary/60 p-4 sm:p-8", reverse && "lg:order-2")}>{visual}</div>
      <div className="max-w-md">
        <IconTile icon={icon} />
        <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
