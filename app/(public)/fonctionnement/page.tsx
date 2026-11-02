import type { Metadata } from "next";
import { Hourglass, Lightbulb, Route, Search, ShieldAlert } from "lucide-react";
import { PageHero, Section, SectionHeading } from "@/components/shared/section";
import { IconTile } from "@/components/shared/icon-tile";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq";
import { speedTargets } from "@/lib/content/categories";

export const metadata: Metadata = {
  title: "Fonctionnement",
  description: "Les étapes de la préparation : entraînement par catégorie, méthodes rapides, examens blancs et suivi.",
};

const steps = [
  { title: "Créez votre compte", text: "L'inscription est gratuite. Votre espace conserve vos résultats et votre historique." },
  { title: "Entraînez-vous par catégorie", text: "Choisissez une catégorie, un niveau et le nombre de questions." },
  { title: "Apprenez les méthodes rapides", text: "Après chaque réponse : solution, méthode rapide, astuce et erreurs fréquentes." },
  { title: "Passez des examens blancs", text: "Mettez-vous en situation : questions tirées au hasard, temps limité, une ou plusieurs épreuves." },
  { title: "Analysez et ciblez", text: "Le rapport et le tableau de bord indiquent les catégories à retravailler." },
];

const pedagogy = [
  { icon: Search, title: "Reconnaître le problème", text: "Repérer les mots et la structure qui trahissent le type de question." },
  { icon: Route, title: "Choisir la méthode", text: "Coefficient multiplicateur, passage à l'unité, écarts successifs…" },
  { icon: Lightbulb, title: "Trouver vite", text: "Utiliser les raccourcis de calcul mental et éliminer les réponses impossibles." },
  { icon: ShieldAlert, title: "Éviter les pièges", text: "Connaître les erreurs fréquentes que les mauvaises réponses exploitent." },
  { icon: Hourglass, title: "Gérer son temps", text: "Savoir passer une question bloquante et y revenir à la fin." },
];

const examRules = [
  "Nombre de questions, durée et barème sont propres à chaque évaluation (par exemple 15 questions en 15 minutes).",
  "La durée peut porter sur l'ensemble de l'évaluation ou sur chaque épreuve séparément.",
  "Une question affichée à la fois ; vous pouvez passer une question et y revenir.",
  "Le chronomètre est calculé par le serveur : recharger la page ne rend pas de temps.",
  "À la fin du temps, les réponses enregistrées sont soumises automatiquement.",
  "Une question sans réponse compte zéro point, sauf si le barème prévoit des points négatifs, ce qui est alors annoncé.",
];

export default function FonctionnementPage() {
  return (
    <>
      <PageHero
        eyebrow="Fonctionnement"
        title="Une préparation progressive, de la méthode à l'examen"
        description="Comprendre, s'entraîner, accélérer, puis se mettre en situation réelle. Chaque étape prépare la suivante."
      />

      <Section>
        <SectionHeading title="Votre parcours de préparation" />
        <ol className="mt-12 grid border-t md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step.title} className="border-b py-6 md:border-b-0 md:border-l md:px-6 md:first:border-l-0 md:first:pl-0">
              <span className="font-mono text-sm text-muted-foreground tabular">0{index + 1}</span>
              <h3 className="mt-3 font-heading font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section dark>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <SectionHeading inverted title="Cinq compétences pour chaque type de question" />
          <p className="max-w-md text-white/60 lg:justify-self-end">
            Les corrections et les fiches de catégorie sont construites autour de ces cinq étapes.
          </p>
        </div>
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {pedagogy.map(({ icon, title, text }) => (
            <li key={title}>
              <IconTile icon={icon} inverted />
              <h3 className="mt-4 font-heading font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              title="Des objectifs de vitesse"
              description="Chaque niveau fixe un temps cible par question. Le dépasser n'est pas une faute : c'est le signal qu'une méthode mérite d'être retravaillée."
            />
            <dl className="mt-10 divide-y border-y">
              {speedTargets.map((target) => (
                <div key={target.level} className="flex items-center gap-6 py-5">
                  <dt className="w-32 font-medium">Niveau {target.level.toLowerCase()}</dt>
                  <dd className="flex flex-1 items-center gap-4">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(target.seconds / 60) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right font-mono text-sm font-semibold tabular">{target.seconds} s</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Règle d&apos;or :</span> ne sacrifiez jamais la précision à
              la vitesse.
            </p>
          </div>

          <div className="rounded-2xl border bg-secondary/60 p-6 sm:p-8">
            <h3 className="font-heading text-xl font-semibold">Règles des examens blancs</h3>
            <p className="mt-2 text-sm text-muted-foreground">Règles générales ; les consignes de chaque évaluation priment.</p>
            <ol className="mt-6 space-y-4">
              {examRules.map((rule, index) => (
                <li key={rule} className="flex gap-4 text-[0.95rem] leading-relaxed">
                  <span className="pt-0.5 font-mono text-sm text-muted-foreground tabular">{index + 1}.</span>
                  {rule}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <div className="border-t">
        <FaqSection />
      </div>
      <CtaBand />
    </>
  );
}
