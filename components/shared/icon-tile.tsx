import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pastille d'icône sobre : fond neutre et contour léger. */
export function IconTile({
  icon: Icon,
  inverted = false,
  className,
}: {
  icon: LucideIcon;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg border",
        inverted ? "border-white/10 bg-white/[0.06] text-white" : "border-border bg-secondary text-primary",
        className,
      )}
    >
      <Icon className="size-[1.15rem]" strokeWidth={1.75} aria-hidden />
    </span>
  );
}
