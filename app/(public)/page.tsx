import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Send,
  Target,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/shared/section";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { CtaBand } from "@/components/marketing/cta-band";
import { ExamPreview } from "@/components/marketing/exam-preview";
import { MethodShowcase } from "@/components/marketing/method-showcase";
import { siteConfig } from "@/lib/site";

const formatFacts = [
  { value: "15", label: "questions par examen blanc" },
  { value: "15 min", label: "chronométrées" },
  { value: "8", label: "catégories d'entraînement" },
  { value: "3", label: "niveaux de difficulté" },
];

const benefits = [
  {
    icon: Target,
    title: "Reconnaître chaque type de problème",
    text: "Identifiez en quelques secondes la nature de la question et la méthode qui s'applique.",
  },
  {
    icon: Gauge,
    title: "Gagner en vitesse sans perdre en précision",
    text: "Des objectifs de 30, 45 et 60 secondes selon la difficulté, avec la justesse comme priorité.",
  },
  {
    icon: GraduationCap,
    title: "Comprendre chaque correction",
    text: "Explication détaillée, méthode classique, méthode rapide, astuce et erreurs fréquentes.",
  },
  {
    icon: BarChart3,
    title: "Mesurer vos progrès",
    text: "Taux de réussite, temps moyen et progression par catégorie pour savoir quoi retravailler.",
  },
];

const simulatorFeatures = [
  { icon: Timer, text: "Chronomètre synchronisé avec le serveur" },
  { icon: ListChecks, text: "Une question à la fois, numérotée" },
  { icon: RotateCcw, text: "Passer une question et y revenir" },
  { icon: CheckCircle2, text: "Repérage des questions répondues" },
  { icon: Send, text: "Soumission manuelle ou automatique à la fin du temps" },
  { icon: BarChart3, text: "Score, temps par question et correction détaillée" },
];

export default function HomePage() {
  return (
    <>
      {/* Héros */}
      <section className="hero-surface relative overflow-hidden text-white">
        <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Préparation aux tests psychotechniques numériques
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] text-balance sm:text-5xl lg:text-6xl">
              Entraînez-vous à résoudre <span className="text-brand-sky">vite et juste</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 text-pretty">
              Suites, calcul mental, pourcentages, proportions… Apprenez les méthodes rapides, travaillez chaque
              catégorie et passez des examens blancs de 15 questions en 15 minutes, dans les conditions du test.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
                <Link href="/fonctionnement">Comment ça marche</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-white/50">{siteConfig.disclaimer}</p>
          </div>
          <div className="animate-rise [animation-delay:120ms] lg:pl-6">
            <ExamPreview className="mx-auto max-w-md lg:max-w-none lg:rotate-1" />
          </div>
        </Container>
      </section>

      {/* Format */}
      <section className="border-b bg-card">
        <Container>
          <dl className="grid grid-cols-2 divide-border py-8 sm:grid-cols-4 sm:divide-x">
            {formatFacts.map((fact) => (
              <div key={fact.label} className="px-2 py-3 text-center sm:px-6">
                <dt className="sr-only">{fact.label}</dt>
                <dd>
                  <span className="block font-heading text-3xl font-extrabold text-primary tabular">{fact.value}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{fact.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Objectif et avantages */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Pourquoi s'entraîner"
            title="Le test se joue à la minute près."
            description="Avec une minute en moyenne par question, la différence se fait sur la méthode. Notre objectif : vous apprendre à reconnaître le problème, choisir la bonne approche et trouver le résultat sans hésiter."
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-heading font-bold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Catégories */}
      <Section className="bg-secondary/50">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="8 catégories"
            title="Toutes les familles de questions numériques"
            description="Chaque catégorie se travaille sur trois niveaux : facile, intermédiaire et difficile."
          />
          <Button asChild variant="outline" size="lg" className="self-start sm:self-auto">
            <Link href="/categories">Toutes les catégories</Link>
          </Button>
        </div>
        <div className="mt-10">
          <CategoryGrid />
        </div>
      </Section>

      {/* Méthodes rapides */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr]">
          <SectionHeading
            eyebrow="Méthodes rapides"
            title="Chaque correction vous apprend un raccourci."
            description="Pour chaque question : l'explication complète, la méthode classique, la méthode rapide, une astuce de calcul mental et les pièges à éviter. Vous comprenez pourquoi, puis vous apprenez à aller plus vite."
          />
          <MethodShowcase />
        </div>
      </Section>

      {/* Simulateur */}
      <section className="hero-surface py-16 text-white sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                inverted
                eyebrow="Examens blancs"
                title="Un véritable environnement d'examen"
                description="15 questions tirées au hasard, 15 minutes au chronomètre. À la fin, un bilan complet : score, réponses justes et fausses, temps par question et correction détaillée."
              />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {simulatorFeatures.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm">
                    <Icon className="mt-0.5 size-4 shrink-0 text-brand-sky" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-brand-sky" aria-hidden />
                <p className="font-heading font-bold">Bilan type d&apos;un examen blanc</p>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4">
                {[
                  ["Score", "12 / 15"],
                  ["Réussite", "80 %"],
                  ["Temps utilisé", "13 min 20"],
                  ["Moyenne par question", "53 s"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/5 p-4">
                    <dt className="text-xs text-white/60">{label}</dt>
                    <dd className="mt-1 font-heading text-2xl font-extrabold tabular">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-white/50">Exemple d&apos;affichage, à titre d&apos;illustration.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Ressources */}
      <Section>
        <div className="grid items-center gap-10 rounded-3xl border bg-card p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
          <SectionHeading
            eyebrow="Bibliothèque"
            title="Des ressources pour réviser à votre rythme"
            description="Questionnaires d'entraînement, notions fondamentales de mathématiques, informations générales et communiqués de recrutement. Chaque document indique sa source et son statut de vérification."
          />
          <div className="flex flex-col gap-3">
            {[
              { icon: FileText, text: "Questionnaires et fiches de méthode en PDF" },
              { icon: BookOpen, text: "Notions fondamentales de mathématiques" },
              { icon: CheckCircle2, text: "Statut de vérification visible sur chaque document" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4 text-sm font-medium">
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                {text}
              </div>
            ))}
            <Button asChild variant="outline" size="lg" className="mt-2 self-start">
              <Link href="/bibliotheque">Découvrir la bibliothèque</Link>
            </Button>
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
