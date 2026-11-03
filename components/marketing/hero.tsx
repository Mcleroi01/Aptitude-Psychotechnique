"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Check, Timer, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaptopFrame, PhoneFrame } from "@/components/marketing/devices";
import { ExamScreen, PhoneResults } from "@/components/marketing/mockups";

gsap.registerPlugin(useGSAP);

const TITLE = "Le test psychotechnique, maîtrisé avant le jour J";

/**
 * Héros animé : fond en incrustation (grille en perspective, halos, cartes
 * flottantes), titre révélé mot à mot, maquettes qui se redressent en 3D et
 * suivent légèrement le pointeur. Tout reste statique si l'utilisateur
 * préfère réduire les animations.
 */
export function Hero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // fromTo (valeurs d'arrivée explicites) : robuste au double rendu du mode développement.
        const shown = { autoAlpha: 1, x: 0, y: 0, clearProps: "transform,opacity,visibility" };
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo("[data-hero-eyebrow]", { y: 16, autoAlpha: 0 }, { ...shown, duration: 0.6 })
          .fromTo("[data-hero-word]", { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.05, clearProps: "transform" }, "-=0.2")
          .fromTo("[data-hero-sub]", { y: 20, autoAlpha: 0 }, { ...shown, duration: 0.7 }, "-=0.5")
          .fromTo("[data-hero-cta-item]", { y: 16, autoAlpha: 0 }, { ...shown, duration: 0.6, stagger: 0.08 }, "-=0.4")
          .fromTo(
            "[data-hero-devices]",
            { y: 120, rotateX: 28, autoAlpha: 0 },
            { ...shown, rotateX: 0, duration: 1.4, ease: "expo.out" },
            "-=0.5",
          )
          .fromTo("[data-hero-chip]", { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "back.out(2)" }, "-=0.9");

        // Halos et cartes : mouvement lent et continu.
        gsap.utils.toArray<HTMLElement>("[data-hero-orb]").forEach((orb, i) => {
          gsap.to(orb, { x: i % 2 ? -90 : 80, y: i % 2 ? 60 : -50, duration: 9 + i * 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
        });
        gsap.utils.toArray<HTMLElement>("[data-hero-chip]").forEach((chip, i) => {
          gsap.to(chip, { y: i % 2 ? 14 : -14, duration: 3 + i * 0.6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.5 });
        });
        gsap.fromTo("[data-hero-grid]", { y: 0 }, { y: 64, duration: 4, repeat: -1, ease: "none" });

        // Inclinaison des maquettes au survol (pointeur fin uniquement).
        const devices = scope.current?.querySelector<HTMLElement>("[data-hero-tilt]");
        if (devices && window.matchMedia("(pointer: fine)").matches) {
          const rotateY = gsap.quickTo(devices, "rotateY", { duration: 0.8, ease: "power3" });
          const rotateX = gsap.quickTo(devices, "rotateX", { duration: 0.8, ease: "power3" });
          const onMove = (event: PointerEvent) => {
            const rect = scope.current!.getBoundingClientRect();
            rotateY(((event.clientX - rect.left) / rect.width - 0.5) * 8);
            rotateX(((event.clientY - rect.top) / rect.height - 0.5) * -6);
          };
          scope.current!.addEventListener("pointermove", onMove);
          return () => scope.current?.removeEventListener("pointermove", onMove);
        }
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative isolate overflow-hidden bg-ink text-white">
      {/* Fond en incrustation */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Halos en dégradé radial (pas de filtre flou : déplacés par transformation, sans repeindre). */}
        <div data-hero-orb className="absolute -top-60 left-[0%] size-[46rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.1_238/0.28),transparent)] will-change-transform" />
        <div data-hero-orb className="absolute top-[20%] right-[-20%] size-[42rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.45_0.16_265/0.45),transparent)] will-change-transform" />
        <div data-hero-orb className="absolute bottom-[-30%] left-[25%] size-[38rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.58_0.14_152/0.16),transparent)] will-change-transform" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] overflow-hidden [perspective:600px]">
          <div className="absolute inset-x-[-50%] bottom-0 h-full origin-bottom [transform:rotateX(62deg)]">
            {/* Grille plus haute d'une case, translatée en boucle : animation composée sur le GPU. */}
            <div
              data-hero-grid
              className="absolute inset-x-0 -top-16 bottom-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.07)_1px,transparent_1px)] bg-[size:64px_64px] will-change-transform"
            />
          </div>
        </div>
        {/* Fondu de la grille vers le haut, par recouvrement plutôt que par masque */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(to_bottom,var(--ink)_10%,transparent_90%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,var(--ink)_85%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
        <p data-hero-eyebrow className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
          <span className="size-1.5 rounded-full bg-success shadow-[0_0_8px] shadow-success" />
          Entraînement libre · sans compte
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl leading-[1.05] font-semibold text-balance sm:text-6xl lg:text-7xl">
          {TITLE.split(" ").map((word, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.16em] -mb-[0.08em] align-bottom">
              <span data-hero-word className="inline-block">
                {word}
                {" "}
              </span>
            </span>
          ))}
        </h1>
        <p data-hero-sub className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65 text-pretty">
          Exercices corrigés pas à pas, examens blancs chronométrés par le serveur et, pour les recruteurs, des
          évaluations sur mesure en plusieurs épreuves.
        </p>
        <div data-hero-cta className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="xl" variant="sky" data-hero-cta-item>
            <Link href="/entrainement">
              S&apos;entraîner maintenant <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="inverse" data-hero-cta-item>
            <Link href="/entreprise/inscription">Espace entreprise</Link>
          </Button>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl [perspective:1400px] sm:mt-20">
          <div data-hero-devices className="relative">
            <div data-hero-tilt className="relative [transform-style:preserve-3d]">
              <LaptopFrame className="mx-auto w-[92%] sm:mr-[2%] sm:ml-auto sm:w-[78%]">
                <ExamScreen />
              </LaptopFrame>
              <PhoneFrame className="absolute bottom-[-4%] left-0 hidden w-[21%] text-left sm:block [transform:translateZ(60px)]">
                <PhoneResults />
              </PhoneFrame>
            </div>
          </div>

          {/* Cartes flottantes */}
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden text-left xl:block">
            <Chip className="top-[8%] -left-[6%]">
              <Timer className="size-4 text-brand-sky" /> <span className="font-mono tabular">12:34</span>
              <span className="text-white/50">restantes</span>
            </Chip>
            <Chip className="top-[38%] -right-[7%]">
              <span className="flex size-5 items-center justify-center rounded-md bg-success text-ink">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              Bonne réponse
            </Chip>
            <Chip className="bottom-[12%] -right-[2%]">
              <TrendingUp className="size-4 text-success" /> Pourcentages <span className="font-semibold text-success">+21 %</span>
            </Chip>
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </section>
  );
}

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      data-hero-chip
      className={`absolute flex items-center gap-2 rounded-xl border border-white/15 bg-[oklch(0.25_0.04_262/0.92)] px-3.5 py-2.5 text-sm whitespace-nowrap text-white shadow-2xl shadow-black/40 ${className}`}
    >
      {children}
    </div>
  );
}
