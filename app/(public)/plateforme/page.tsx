import type { Metadata } from "next";
import { Check, Compass, Eye, ShieldCheck, Sparkles, X } from "lucide-react";
import { PageHero, Section, SectionHeading } from "@/components/shared/section";
import { IconTile } from "@/components/shared/icon-tile";
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
  "Des examens blancs chronométrés, en une ou plusieurs épreuves",
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
    text: "Chaque document de la bibliothèque affiche sa source et son statut : vérifié, non vérifié ou contenu de la plateforme.",
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

function CheckList({ items, negative = false }: { items: string[]; negative?: boolean }) {
  const Icon = negative ? X : Check;
  return (
    <ul className="divide-y border-y">
      {items.map((item) => (
        <li key={item} className="flex gap-3 py-4 text-[0.95rem]">
          <Icon className={negative ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0 text-success"} aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PlateformePage() {
  return (
    <>
      <PageHero
        eyebrow="La plateforme"
        title="Un espace de préparation pensé pour les candidats"
        description="Comprendre les types de questions, maîtriser les méthodes rapides et s'habituer à la pression du chronomètre."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionHeading
            title="Donner à chaque candidat les moyens de se préparer"
            description="Les tests psychotechniques numériques ne demandent pas de connaissances avancées, mais des réflexes : repérer la structure d'un problème, choisir la bonne méthode, calculer de tête et gérer son temps. Ces réflexes s'acquièrent par un entraînement régulier et bien guidé."
          />
          <div>
            <h3 className="font-heading text-lg font-semibold">À qui s&apos;adresse la plateforme</h3>
            <div className="mt-5">
              <CheckList items={audience} />
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-t bg-secondary/50">
        <SectionHeading
          title="Une plateforme indépendante"
          description="Aptitude Psychotechnique n'est affiliée à aucun recruteur. Elle n'est ni approuvée ni gérée par la Banque Centrale du Congo, dont elle ne publie pas les épreuves."
        />
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <div>
            <h3 className="font-heading text-lg font-semibold">Ce que la plateforme est</h3>
            <div className="mt-5">
              <CheckList items={isList} />
            </div>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Ce qu&apos;elle n&apos;est pas</h3>
            <div className="mt-5">
              <CheckList items={isNotList} negative />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading title="Nos engagements" />
        <ul className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map(({ icon, title, text }) => (
            <li key={title}>
              <IconTile icon={icon} />
              <h3 className="mt-4 font-heading font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand />
    </>
  );
}
