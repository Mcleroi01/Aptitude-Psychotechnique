import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  id,
  className,
  dark = false,
  children,
}: {
  id?: string;
  className?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("py-20 sm:py-28", dark && "bg-ink text-ink-foreground", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, inverted = false }: { children: ReactNode; inverted?: boolean }) {
  return (
    <p
      className={cn(
        "text-[0.7rem] font-semibold uppercase tracking-[0.16em]",
        inverted ? "text-white/55" : "text-muted-foreground",
      )}
    >
      {children}
    </p>
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
      {eyebrow && <Eyebrow inverted={inverted}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "text-3xl font-semibold text-balance sm:text-[2.6rem] sm:leading-[1.1]",
          eyebrow && "mt-4",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed text-pretty sm:text-[1.05rem]",
            inverted ? "text-white/65" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** En-tête sombre des pages secondaires, avec fil d'Ariane. */
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
    <section className="bg-ink text-white">
      <Container className="py-20 text-center sm:py-24">
        <Eyebrow inverted>Psychotechnique · {eyebrow}</Eyebrow>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold text-balance sm:text-5xl sm:leading-[1.08]">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65 text-pretty">{description}</p>
        {children}
      </Container>
    </section>
  );
}
