import Link from "next/link";
import { cn } from "@/lib/utils";

/** Emblème : quatre cases de réponse, dont une cochée. */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const fill = inverted ? "fill-white" : "fill-primary";
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect x="1" y="1" width="11" height="11" rx="2.5" className={fill} />
      <rect x="16" y="1" width="11" height="11" rx="2.5" className={fill} opacity="0.35" />
      <rect x="1" y="16" width="11" height="11" rx="2.5" className={fill} opacity="0.35" />
      <rect x="16" y="16" width="11" height="11" rx="2.5" className="fill-brand-sky" />
      <path
        d="m4 6.6 2 2 3.2-3.6"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inverted ? "stroke-ink" : "stroke-white"}
      />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="BCC Psychotechnique, accueil">
      <LogoMark inverted={inverted} />
      <span
        className={cn(
          "font-heading text-[0.95rem] leading-[1.05] font-semibold tracking-tight",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        BCC
        <br />
        psychotechnique
      </span>
    </Link>
  );
}
