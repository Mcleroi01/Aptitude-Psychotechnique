import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export function CtaBand({
  title = "Commencez votre préparation dès maintenant",
  description = "Sans inscription : choisissez une catégorie et lancez votre première série. Créez un compte plus tard pour garder votre historique.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.1_238/0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--ink)_70%)]" />
      </div>
      <Container className="text-center">
        <h2 data-reveal className="mx-auto max-w-2xl text-3xl font-semibold text-balance sm:text-[2.8rem] sm:leading-[1.08]">
          {title}
        </h2>
        <p data-reveal className="mx-auto mt-5 max-w-xl text-white/65">
          {description}
        </p>
        <div data-stagger className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="xl" variant="sky">
            <Link href="/entrainement">
              S&apos;entraîner sans compte <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="inverse">
            <Link href="/inscription">Créer un compte gratuit</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
