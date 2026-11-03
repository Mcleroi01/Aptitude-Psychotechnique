"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** État final explicite ; les styles en ligne sont retirés pour laisser jouer les transitions CSS (survol). */
const SHOWN = { autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility" };

/**
 * Animations au défilement pilotées par attributs, pour garder les pages en
 * composants serveur :
 *  - data-reveal               apparition en glissant vers le haut
 *  - data-stagger              apparition échelonnée des enfants directs
 *  - data-parallax="0.15"      décalage vertical lié au défilement
 *  - data-count="41"           compteur animé jusqu'à la valeur
 *  - data-cascade              cartes empilées qui se déploient
 * Rien n'est animé si l'utilisateur préfère réduire les animations : le
 * contenu reste alors simplement visible.
 */
export function ScrollMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);

        q("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 48, autoAlpha: 0 },
            { ...SHOWN, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } },
          );
        });

        q("[data-stagger]").forEach((el) => {
          gsap.fromTo(
            el.children,
            { y: 32, autoAlpha: 0 },
            { ...SHOWN, duration: 0.8, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: el, start: "top 85%", once: true } },
          );
        });

        q("[data-parallax]").forEach((el) => {
          const speed = Number(el.getAttribute("data-parallax")) || 0.15;
          gsap.fromTo(
            el,
            { yPercent: speed * 60 },
            { yPercent: speed * -60, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });

        q("[data-count]").forEach((el) => {
          const target = Number(el.getAttribute("data-count")) || 0;
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(counter.value));
            },
          });
        });

        q("[data-cascade]").forEach((el) => {
          gsap.fromTo(
            el.children,
            { y: (i) => -60 * (i + 1), rotate: (i) => (i % 2 ? 3 : -3), autoAlpha: 0 },
            { ...SHOWN, rotate: 0, duration: 1, ease: "back.out(1.4)", stagger: 0.15, scrollTrigger: { trigger: el, start: "top 80%", once: true } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope, dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={scope}>{children}</div>;
}
