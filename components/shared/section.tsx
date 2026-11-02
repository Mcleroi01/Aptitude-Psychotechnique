import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  inverted?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-sky">{eyebrow}</p>
      )}
      <h2
        className={cn(
          "mt-3 text-3xl font-extrabold text-balance sm:text-4xl",
          inverted ? "text-white" : "text-primary",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-pretty sm:text-lg",
            inverted ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** En-tête des pages secondaires (fond marine). */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="hero-surface relative overflow-hidden text-white">
      <Container className="relative py-16 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-sky">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-balance sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75 text-pretty">{description}</p>
        {children}
      </Container>
    </section>
  );
}
