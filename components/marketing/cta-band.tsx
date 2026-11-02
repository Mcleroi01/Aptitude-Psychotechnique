import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export function CtaBand({
  title = "Commencez votre préparation dès aujourd'hui",
  description = "Créez votre compte gratuitement, choisissez une catégorie et faites votre premier examen blanc.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="bg-ink py-20 text-white sm:py-24">
      <Container className="text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-balance sm:text-[2.6rem] sm:leading-[1.1]">
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-white/65">{description}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="xl" variant="sky">
            <Link href="/inscription">
              Créer mon compte <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="inverse">
            <Link href="/connexion">J&apos;ai déjà un compte</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
