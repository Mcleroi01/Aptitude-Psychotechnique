import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CircleSlash,
  Gauge,
  Layers,
  Lightbulb,
  ListChecks,
  MonitorSmartphone,
  SkipForward,
  SlidersHorizontal,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/shared/section";
import { IconTile } from "@/components/shared/icon-tile";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq";
import { FeatureRow } from "@/components/marketing/feature-row";
import { LaptopFrame, PhoneFrame } from "@/components/marketing/devices";
import { ExamScreen, PhoneResults, PracticeSetupCard, ReportCard, ReviewCard } from "@/components/marketing/mockups";
import { categories } from "@/lib/content/categories";

const features = [
  { icon: Layers, title: "8 catégories", text: "Suites, calcul mental, logique, pourcentages, fractions, proportions, comparaisons et problèmes." },
  { icon: SlidersHorizontal, title: "3 niveaux", text: "Facile, intermédiaire ou difficile : progressez à votre rythme dans chaque catégorie." },
  { icon: Timer, title: "Chronomètre", text: "Temps global ou par épreuve, contrôlé par le serveur comme lors d'un vrai test." },
  { icon: SkipForward, title: "Questions passées", text: "Passez une question bloquante et revenez-y avant la fin du temps." },
  { icon: CircleSlash, title: "Sans points négatifs", text: "Une question sans réponse vaut zéro : apprenez quand il vaut mieux passer." },
  { icon: ListChecks, title: "Corrections", text: "Chaque question a une solution rédigée étape par étape." },
  { icon: Lightbulb, title: "Méthodes rapides", text: "Le raccourci de calcul mental qui fait gagner de précieuses secondes." },
  { icon: Gauge, title: "Objectifs de vitesse", text: "30, 45 ou 60 secondes par question selon la difficulté." },
  { icon: BarChart3, title: "Rapport d'examen", text: "Score, réponses justes et fausses, temps utilisé et temps par question." },
  { icon: TrendingUp, title: "Progression", text: "Votre taux de réussite par catégorie, pour savoir quoi retravailler." },
  { icon: BookOpen, title: "Bibliothèque", text: "Fiches de méthode, notions de mathématiques et ressources de préparation." },
  { icon: MonitorSmartphone, title: "Tous les appareils", text: "Ordinateur, tablette ou téléphone : votre espace vous suit partout." },
];

export default function HomePage() {
  return (
    <>
      {/* Héros */}
      <section className="overflow-hidden bg-ink text-white">
        <Container className="pt-16 text-center sm:pt-24">
          <Eyebrow inverted>Tests psychotechniques numériques</Eyebrow>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold text-balance sm:text-6xl sm:leading-[1.04]">
            Préparez votre test psychotechnique avec méthode
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65 text-pretty">
            Exercices corrigés dans 8 catégories, méthodes de calcul rapide et examens blancs chronométrés, dans les
            conditions du test.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" variant="sky">
              <Link href="/inscription">
                Commencer gratuitement <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="inverse">
              <Link href="/fonctionnement">Voir le fonctionnement</Link>
            </Button>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl sm:mt-20">
            <LaptopFrame className="mx-auto w-[92%] sm:mr-[2%] sm:ml-auto sm:w-[78%]">
              <ExamScreen />
            </LaptopFrame>
            <PhoneFrame className="absolute bottom-[-4%] left-0 hidden w-[21%] text-left sm:block">
              <PhoneResults />
            </PhoneFrame>
          </div>
        </Container>
      </section>

      {/* Fonctionnalités */}
      <Section dark className="border-t border-white/10">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <SectionHeading inverted title="Toutes les fonctionnalités" />
          <p className="max-w-md text-white/60 lg:justify-self-end">
            Tout est inclus dans votre compte gratuit : entraînement, corrections, examens blancs et suivi de vos
            résultats.
          </p>
        </div>
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, title, text }) => (
            <li key={title}>
              <IconTile icon={icon} inverted />
              <h3 className="mt-4 font-heading text-base font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Fonctionnement détaillé */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <SectionHeading title="Un entraînement proche du test réel" />
          <p className="max-w-md leading-relaxed text-muted-foreground lg:justify-self-end">
            Trois éléments rapprochent l&apos;entraînement de l&apos;épreuve : les conditions que vous choisissez, les
            corrections dont vous apprenez et le rapport que vous obtenez.
          </p>
        </div>
        <div className="mt-16 space-y-20 sm:space-y-28">
          <FeatureRow icon={SlidersHorizontal} title="Un entraînement ciblé" visual={<PracticeSetupCard />}>
            <p>
              Choisissez une catégorie, un niveau et un nombre de questions. Chaque série affiche un objectif de temps
              par question : 30 secondes en facile, 45 en intermédiaire, 60 en difficile.
            </p>
            <p>
              Quand vous êtes prêt, passez à l&apos;examen blanc : des questions tirées au hasard dans toutes les
              catégories, avec un temps limité, par exemple 15 questions en 15 minutes.
            </p>
          </FeatureRow>
          <FeatureRow reverse icon={Lightbulb} title="Des corrections pas à pas" visual={<ReviewCard />}>
            <p>
              Chaque solution est rédigée en étapes numérotées, avec le calcul de chacune : vous voyez exactement où
              votre raisonnement a dévié.
            </p>
            <p>
              Votre réponse et la bonne réponse sont affichées côte à côte, suivies de la méthode rapide et des erreurs
              fréquentes à éviter.
            </p>
          </FeatureRow>
          <FeatureRow icon={BarChart3} title="Un rapport après chaque examen" visual={<ReportCard />}>
            <p>
              Score, réponses justes, fausses et non répondues, temps total et temps moyen par question : vous savez
              précisément où vous en êtes.
            </p>
            <p>
              La réussite par catégorie indique quoi retravailler avant le prochain examen. Tous vos résultats restent
              dans votre historique.
            </p>
          </FeatureRow>
        </div>
      </Section>

      {/* Catégories */}
      <Section className="border-t bg-secondary/50">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <SectionHeading title="Les 8 catégories d'entraînement" />
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline lg:justify-self-end"
          >
            Méthode et exemple pour chaque catégorie <ArrowRight className="size-4" />
          </Link>
        </div>
        <ol className="mt-12 grid border-t sm:grid-cols-2 sm:gap-x-12">
          {categories.map((category, index) => (
            <li key={category.slug} className="border-b">
              <Link href={`/categories#${category.slug}`} className="group flex gap-5 py-5">
                <span className="w-6 pt-0.5 font-mono text-sm text-muted-foreground tabular">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="block font-heading font-semibold text-foreground group-hover:text-primary">
                    {category.name}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      <FaqSection />
      <CtaBand />
    </>
  );
}
