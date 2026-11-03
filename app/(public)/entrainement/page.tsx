import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/shared/section";
import { TrainingHub } from "@/features/attempts/components/training-hub";
import { getSessionUser } from "@/lib/guards";

export const metadata: Metadata = {
  title: "S'entraîner",
  description: "Entraînement libre et examens blancs chronométrés, sans création de compte.",
};

export default async function EntrainementPage() {
  const user = await getSessionUser();
  return (
    <>
      <PageHero
        eyebrow="S'entraîner"
        title="Entraînez-vous, sans compte"
        description="Questions originales corrigées pas à pas et examens blancs en conditions réelles. Un compte gratuit permet seulement de conserver votre historique."
      />
      <Section>
        <TrainingHub />
        {!user && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Vos séries sont gardées sur ce navigateur pendant 30 jours.{" "}
            <Link href="/inscription" className="font-semibold text-primary underline-offset-4 hover:underline">
              Créez un compte
            </Link>{" "}
            pour les conserver durablement : elles y seront rattachées automatiquement.
          </p>
        )}
      </Section>
    </>
  );
}
