import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CircleSlash,
  ClipboardCheck,
  Gauge,
  Layers,
  Lightbulb,
  ListChecks,
  MonitorSmartphone,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/shared/section";
import { IconTile } from "@/components/shared/icon-tile";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq";
import { FeatureRow } from "@/components/marketing/feature-row";
import { Hero } from "@/components/marketing/hero";
import { Marquee } from "@/components/marketing/marquee";
import { PracticeSetupCard, ReportCard, ReviewCard } from "@/components/marketing/mockups";
import { SpotlightCard, SpotlightGrid } from "@/components/marketing/spotlight-grid";
import { categories } from "@/lib/content/categories";

const stats = [
  { value: 8, label: "catégories d'exercices" },
  { value: 6, label: "formats de questions" },
  { value: 3, label: "niveaux de difficulté" },
  { value: 0, label: "compte requis pour s'entraîner" },
];

const features = [
  { icon: Layers, title: "8 catégories", text: "Suites, calcul mental, logique, pourcentages, fractions, proportions, comparaisons et problèmes." },
  { icon: SlidersHorizontal, title: "3 niveaux", text: "Facile, intermédiaire ou difficile : progressez à votre rythme dans chaque catégorie." },
  { icon: Timer, title: "Chronomètre serveur", text: "Temps global ou par épreuve, contrôlé par le serveur comme lors d'un vrai test." },
  { icon: SkipForward, title: "Questions passées", text: "Marquez une question bloquante et revenez-y avant la fin du temps." },
  { icon: CircleSlash, title: "Barème annoncé", text: "Points négatifs ou non : les règles sont affichées avant de commencer." },
  { icon: ListChecks, title: "Corrections", text: "Chaque question a une solution rédigée étape par étape." },
  { icon: Lightbulb, title: "Méthodes rapides", text: "Le raccourci de calcul mental qui fait gagner de précieuses secondes." },
  { icon: Gauge, title: "Objectifs de vitesse", text: "30, 45 ou 60 secondes par question selon la difficulté." },
  { icon: BarChart3, title: "Rapport détaillé", text: "Score, temps utilisé et réussite par épreuve et par catégorie." },
  { icon: TrendingUp, title: "Progression", text: "Créez un compte quand vous voulez : vos séries y sont rattachées." },
  { icon: BookOpen, title: "Bibliothèque", text: "Fiches de méthode, notions de mathématiques et ressources de préparation." },
  { icon: MonitorSmartphone, title: "Tous les appareils", text: "Ordinateur, tablette ou téléphone, avec reprise après coupure." },
];

const enterprisePoints = [
  { icon: Layers, text: "Une ou plusieurs épreuves, chacune avec sa durée, son barème et son seuil." },
  { icon: ClipboardCheck, text: "Six formats de questions, correction automatique ou manuelle anonyme." },
  { icon: Users, text: "Campagnes par lien ou sur invitation, résultats confidentiels jusqu'à la clôture." },
  { icon: ShieldCheck, text: "Banque de questions privée, invisible des autres organisations." },
];

const sampleSections = [
  { title: "Raisonnement numérique", meta: "20 questions · 20 min · tirage aléatoire", tone: "bg-brand-sky" },
  { title: "Logique", meta: "15 questions · 15 min · sans retour", tone: "bg-success" },
  { title: "Cas pratique rédigé", meta: "3 questions · correction manuelle", tone: "bg-warning" },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee items={categories.map((c) => c.name)} />

      {/* Chiffres clés */}
      <section className="bg-ink text-white">
        <dl data-stagger className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 py-4 text-center lg:border-l lg:border-white/10 lg:first:border-l-0">
              <dd className="font-heading text-5xl font-semibold tabular sm:text-6xl">
                <span data-count={stat.value}>{stat.value}</span>
              </dd>
              <dt className="mt-2 text-sm text-white/55">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Fonctionnalités */}
      <Section dark className="border-t border-white/10">
        <div data-reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <SectionHeading inverted title="Toutes les fonctionnalités" />
          <p className="max-w-md text-white/60 lg:justify-self-end">
            Accès libre : entraînement, corrections et examens blancs sans inscription. Le compte gratuit conserve
            seulement votre historique.
          </p>
        </div>
        <div data-stagger className="mt-14">
          <SpotlightGrid className="sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon, title, text }) => (
              <SpotlightCard key={title}>
                <div className="relative z-10">
                  <IconTile icon={icon} inverted />
                  <h3 className="mt-4 font-heading text-base font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{text}</p>
                </div>
              </SpotlightCard>
            ))}
          </SpotlightGrid>
        </div>
      </Section>

      {/* Fonctionnement détaillé */}
      <Section>
        <div data-reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
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
              Quand vous êtes prêt, passez à l&apos;examen blanc : des questions tirées au hasard, avec un temps limité,
              par exemple 15 questions en 15 minutes.
            </p>
          </FeatureRow>
          <FeatureRow reverse icon={Lightbulb} title="Des corrections pas à pas" visual={<ReviewCard />}>
            <p>
              Chaque solution est rédigée en étapes numérotées, avec le calcul de chacune : vous voyez exactement où
              votre raisonnement a dévié.
            </p>
            <p>Votre réponse et la bonne réponse sont affichées côte à côte, suivies de la méthode rapide.</p>
          </FeatureRow>
          <FeatureRow icon={BarChart3} title="Un rapport après chaque examen" visual={<ReportCard />}>
            <p>Score, réponses justes et non répondues, temps utilisé : vous savez précisément où vous en êtes.</p>
            <p>La réussite par catégorie indique quoi retravailler avant le prochain examen.</p>
          </FeatureRow>
        </div>
      </Section>

      {/* Entreprises */}
      <Section dark className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] size-[36rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.1_238/0.15),transparent)]" />
        <div className="relative grid gap-14 lg:grid-cols-2 lg:items-center">
          <div data-reveal>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-brand-sky">
              <Building2 className="size-4" aria-hidden /> Pour les recruteurs
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">Vos évaluations, sur mesure</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-white/60">
              Composez vos propres questionnaires et faites passer vos candidats dans les mêmes conditions de rigueur :
              chronométrage serveur, soumission automatique, rapports téléchargeables.
            </p>
            <ul data-stagger className="mt-8 space-y-4">
              {enterprisePoints.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-white/80">
                  <Icon className="mt-0.5 size-5 shrink-0 text-brand-sky" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
            <Button asChild size="xl" variant="sky" className="mt-9">
              <Link href="/entreprise/inscription">
                Créer un espace entreprise <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <div className="relative" aria-hidden>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 sm:p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Évaluation · Analystes 2027</span>
                <span className="rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-success">Prête</span>
              </div>
              <ol data-cascade className="mt-5 space-y-3">
                {sampleSections.map((s, i) => (
                  <li key={s.title} className="flex items-center gap-4 rounded-xl border border-white/10 bg-ink/80 px-4 py-3.5">
                    <span className={`flex size-8 items-center justify-center rounded-lg font-mono text-sm font-semibold text-ink ${s.tone}`}>
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.title}</span>
                      <span className="block truncate text-xs text-white/50">{s.meta}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-xs text-white/50">
                <span>3 épreuves · 38 questions</span>
                <span>Seuil de réussite : 60 %</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Catégories */}
      <Section className="border-t bg-secondary/50">
        <div data-reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <SectionHeading title="Les 8 catégories d'entraînement" />
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline lg:justify-self-end"
          >
            Méthode et exemple pour chaque catégorie <ArrowRight className="size-4" />
          </Link>
        </div>
        <ol data-stagger className="mt-12 grid border-t sm:grid-cols-2 sm:gap-x-12">
          {categories.map((category, index) => (
            <li key={category.slug} className="border-b">
              <Link href={`/categories#${category.slug}`} className="group flex gap-5 py-5">
                <span className="w-6 pt-0.5 font-mono text-sm text-muted-foreground tabular">{String(index + 1).padStart(2, "0")}</span>
                <span className="flex-1">
                  <span className="block font-heading font-semibold text-foreground group-hover:text-primary">{category.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{category.description}</span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
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
