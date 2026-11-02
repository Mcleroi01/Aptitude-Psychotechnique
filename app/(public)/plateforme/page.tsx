import type { Metadata } from "next";
import { Check, Compass, Eye, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { PageHero, Section, SectionHeading } from "@/components/shared/section";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  title: "La plateforme",
  description: "Une plateforme indépendante pour se préparer aux tests psychotechniques numériques des recrutements.",
};

const audience = [
  "Candidats convoqués à un test psychotechnique numérique dans le cadre d'un recrutement",
  "Jeunes diplômés qui préparent des concours ou des tests d'embauche",
  "Professionnels qui veulent retrouver leurs réflexes de calcul mental",
];

const isList = [
  "Un outil d'entraînement structuré, catégorie par catégorie",
  "Des questions originales, avec corrections et méthodes rapides",
  "Des examens blancs chronométrés au format 15 questions / 15 minutes",
  "Un suivi personnel de vos résultats et de votre progression",
];

const isNotList = [
  "Un site officiel de la Banque Centrale du Congo ou d'un autre recruteur",
  "Un service d'inscription ou de candidature à un recrutement",
  "Une source de sujets officiels ou de réponses à un test réel",
  "Une garantie de réussite : seul votre entraînement fait la différence",
];

const principles = [
  {
    icon: Sparkles,
    title: "Contenus originaux",
    text: "Les exercices sont conçus pour l'entraînement à partir des types de questions courants. Aucun n'est présenté comme issu d'une épreuve officielle.",
  },
  {
    icon: Eye,
    title: "Transparence documentaire",
    text: "Chaque document de la bibliothèque affiche sa source et son statut : vérifié, non vérifié ou contenu pédagogique de la plateforme.",
  },
  {
    icon: Compass,
    title: "Pédagogie avant tout",
    text: "Comprendre d'abord, accélérer ensuite. La précision n'est jamais sacrifiée à la vitesse.",
  },
  {
    icon: ShieldCheck,
    title: "Respect de vos données",
    text: "Vos résultats sont personnels. Les mots de passe sont chiffrés et l'accès aux données est contrôlé côté serveur.",
  },
];

export default function PlateformePage() {
  return (
    <>
      <PageHero
        eyebrow="La plateforme"
        title="Un espace de préparation pensé pour les candidats"
        description="BCC Psychotechnique aide les candidats à se préparer aux tests psychotechniques numériques : comprendre les types de questions, maîtriser les méthodes rapides et s'habituer à la pression du chronomètre."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Notre mission"
            title="Donner à chaque candidat les mêmes chances de se préparer."
            description="Les tests psychotechniques numériques ne demandent pas de connaissances avancées, mais des réflexes : repérer la structure d'un problème, choisir la bonne méthode, calculer de tête et gérer son temps. Ces réflexes s'acquièrent par un entraînement régulier et bien guidé."
          />
          <div className="rounded-3xl border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <Users className="size-5" aria-hidden />
              </span>
              <h3 className="font-heading text-lg font-bold text-primary">Pour qui ?</h3>
            </div>
            <ul className="mt-6 space-y-4">
              {audience.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary/50">
        <SectionHeading
          align="center"
          eyebrow="Indépendance"
          title="Ce que la plateforme est, et ce qu'elle n'est pas"
          description="BCC Psychotechnique est une initiative indépendante. Elle n'est ni affiliée, ni approuvée, ni gérée par la Banque Centrale du Congo."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-success/25 bg-card p-6 sm:p-8">
            <h3 className="font-heading text-lg font-bold text-success">La plateforme est</h3>
            <ul className="mt-5 space-y-3.5">
              {isList.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-destructive/20 bg-card p-6 sm:p-8">
            <h3 className="font-heading text-lg font-bold text-destructive">La plateforme n&apos;est pas</h3>
            <ul className="mt-5 space-y-3.5">
              {isNotList.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Nos engagements" title="Les principes qui guident la plateforme" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-heading font-bold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand />
    </>
  );
}
