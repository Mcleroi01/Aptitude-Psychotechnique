import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export function CtaBand({
  title = "Prêt à commencer votre préparation ?",
  description = "Créez votre compte gratuitement, choisissez une catégorie et faites votre premier examen blanc aujourd'hui.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="hero-surface relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold text-balance sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">{description}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" variant="sky">
              <Link href="/inscription">
                Commencer la préparation <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/connexion">J&apos;ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
