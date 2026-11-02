import Link from "next/link";
import { cn } from "@/lib/utils";

/** Emblème : cadran de chronomètre et coche de validation. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9 shrink-0", className)}>
      <rect width="40" height="40" rx="11" className="fill-primary" />
      <rect x="17" y="5.5" width="6" height="3" rx="1.5" className="fill-brand-sky" />
      <circle cx="20" cy="22" r="10.5" fill="none" strokeWidth="2.6" className="stroke-brand-sky" opacity="0.35" />
      <path
        d="M20 11.5a10.5 10.5 0 0 1 10.5 10.5"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-brand-sky"
      />
      <path
        d="m15.2 22.4 3.4 3.3 6.4-6.9"
        fill="none"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-success"
      />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="BCC Psychotechnique, accueil">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading text-[0.95rem] font-extrabold", inverted ? "text-white" : "text-primary")}>
          BCC Psychotechnique
        </span>
        <span className={cn("mt-1 text-[0.68rem] font-medium", inverted ? "text-white/60" : "text-muted-foreground")}>
          Préparation indépendante
        </span>
      </span>
    </Link>
  );
}
