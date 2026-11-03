"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Bandeau défilant en boucle ; il ralentit au survol et reste fixe si les animations sont réduites. */
export function Marquee({ items }: { items: string[] }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tween = gsap.to("[data-marquee-track]", { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
        const el = scope.current!;
        const slow = () => gsap.to(tween, { timeScale: 0.2, duration: 0.6 });
        const resume = () => gsap.to(tween, { timeScale: 1, duration: 0.6 });
        el.addEventListener("pointerenter", slow);
        el.addEventListener("pointerleave", resume);
        return () => {
          el.removeEventListener("pointerenter", slow);
          el.removeEventListener("pointerleave", resume);
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  const row = (hidden: boolean) =>
    items.map((item, i) => (
      <li key={`${hidden}-${i}`} aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pr-10">
        <span className="font-heading text-2xl font-semibold whitespace-nowrap text-white/85 sm:text-3xl">{item}</span>
        <span className="size-2 rotate-45 rounded-[2px] bg-brand-sky" />
      </li>
    ));

  return (
    <div ref={scope} className="relative overflow-hidden border-y border-white/10 bg-ink py-6">
      {/* Fondus latéraux par recouvrement (pas de masque sur la piste animée) */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
      <ul data-marquee-track className="flex w-max">
        {row(false)}
        {row(true)}
      </ul>
    </div>
  );
}
