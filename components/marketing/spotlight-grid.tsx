"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Grille de cartes en cadre lumineux : un halo suit le pointeur et éclaire la
 * bordure de la carte survolée. La bordure est un fond en dégradé visible sur
 * 1 px autour du contenu (sans masque CSS, coûteux à l'affichage).
 */
export function SpotlightGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const frame = useRef(0);

  const onMove = (event: React.PointerEvent) => {
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    // Une mise à jour par image au plus.
    frame.current = requestAnimationFrame(() => {
      for (const card of ref.current?.querySelectorAll<HTMLElement>("[data-spotlight]") ?? []) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--x", `${clientX - rect.left}px`);
        card.style.setProperty("--y", `${clientY - rect.top}px`);
      }
    });
  };

  return (
    <ul ref={ref} onPointerMove={onMove} className={cn("group/spot grid gap-3", className)}>
      {children}
    </ul>
  );
}

export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <li
      data-spotlight
      className={cn(
        "relative rounded-2xl bg-white/10 p-px transition-colors",
        "group-hover/spot:bg-[radial-gradient(240px_circle_at_var(--x)_var(--y),oklch(0.78_0.1_238/0.75),rgb(255_255_255/0.08)_70%)]",
        className,
      )}
    >
      <div className="relative h-full rounded-[calc(1rem-1px)] bg-ink p-6 group-hover/spot:bg-[radial-gradient(320px_circle_at_var(--x)_var(--y),oklch(0.3_0.05_255),var(--ink)_70%)]">
        {children}
      </div>
    </li>
  );
}
