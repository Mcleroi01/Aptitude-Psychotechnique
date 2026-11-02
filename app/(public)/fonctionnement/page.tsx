import type { Metadata } from "next";
import { Crosshair, Hourglass, Lightbulb, Route, Search, ShieldAlert } from "lucide-react";
import { PageHero, Section, SectionHeading } from "@/components/shared/section";
import { CtaBand } from "@/components/marketing/cta-band";
import { speedTargets } from "@/lib/content/categories";
import { DEFAULT_EXAM } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fonctionnement",
  description: "Les étapes de la préparation : entraînement par catégorie, méthodes rapides, examens blancs et suivi.",
};

const steps = [
  {
    title: "Créez votre compte",
    text: "L'inscription est gratuite. Votre espace personnel conserve vos résultats et votre historique.",
  },
  {
    title: "Entraînez-vous par catégorie",
    text: "Choisissez une catégorie, un niveau (facile, intermédiaire, difficile) et le nombre de questions.",
  },
  {
    title: "Apprenez les méthodes rapides",
    text: "Après chaque réponse : explication, méthode classique, méthode rapide, astuce et erreurs fréquentes.",
  },
  {
    title: "Passez des examens blancs",
    text: `${DEFAULT_EXAM.questionCount} questions tirées au hasard en ${DEFAULT_EXAM.durationSeconds / 60} minutes, dans les conditions du test.`,
  },
  {
    title: "Analysez et ciblez",
    text: "Score, temps par question, catégories fragiles : le tableau de bord vous indique quoi retravailler.",
  },
];

const pedagogy = [
  { icon: Search, title: "Reconnaître le problème", text: "Repérer les mots et la structure qui trahissent le type de question." },
  { icon: Route, title: "Choisir la méthode", text: "Savoir quelle approche s'applique : coefficient, passage à l'unité, écarts…" },
  { icon: Lightbulb, title: "Trouver vite", text: "Utiliser les raccourcis de calcul mental et l'élimination des réponses." },
  { icon: ShieldAlert, title: "Éviter les pièges", text: "Connaître les erreurs fréquentes que les distracteurs exploitent." },
  { icon: Hourglass, title: "Gérer son temps", text: "Savoir passer une question bloquante et y revenir à la fin." },
];

const examRules = [
  `${DEFAULT_EXAM.questionCount} questions à choix multiples, une seule bonne réponse par question.`,
  `${DEFAULT_EXAM.durationSeconds / 60} minutes au total, soit environ une minute par question.`,
  "Une question affichée à la fois ; vous pouvez passer une question et y revenir.",
  "Le chronomètre est calculé par le serveur : recharger la page ne rend pas de temps.",
  "À la fin du temps, vos réponses enregistrées sont soumises automatiquement.",
  "Une question sans réponse compte zéro point ; il n'y a pas de points négatifs.",
];

const faq = [
  {
    q: "Les questions proviennent-elles du vrai test ?",
    a: "Non. Toutes les questions sont originales et conçues pour l'entraînement à partir des types d'exercices courants. Aucune n'est présentée comme issue d'une épreuve officielle.",
  },
  {
    q: "La plateforme est-elle liée à la Banque Centrale du Congo ?",
    a: "Non. C'est une plateforme indépendante de préparation, sans lien avec la Banque Centrale du Congo ni avec aucun recruteur.",
  },
  {
    q: "Puis-je utiliser la plateforme sur mon téléphone ?",
    a: "Oui. Toutes les pages, y compris le simulateur d'examen, sont conçues pour ordinateur, tablette et smartphone.",
  },
  {
    q: "Dois-je privilégier la vitesse ou la justesse ?",
    a: "La justesse d'abord. Une réponse rapide mais fausse ne rapporte rien. La vitesse vient naturellement quand la méthode est maîtrisée.",
  },
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
        <SectionHeading eyebrow="Les étapes" title="Votre parcours de préparation" />
        <ol className="mt-12 grid gap-6 md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border bg-card p-5">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary font-heading text-lg font-extrabold text-white tabular">
                {index + 1}
              </span>
              <h3 className="mt-4 font-heading font-bold text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="bg-secondary/50">
        <SectionHeading
          eyebrow="Approche pédagogique"
          title="Pour chaque type de question, cinq compétences"
          description="Les corrections et les fiches de catégorie sont construites autour de ces cinq étapes."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pedagogy.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-brand-sky" aria-hidden />
                <span className="font-mono text-xs text-muted-foreground tabular">0{index + 1}</span>
              </div>
              <h3 className="mt-4 font-heading font-bold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Objectifs de vitesse"
              title="Des temps cibles selon la difficulté"
              description="Les exercices de vitesse fixent un objectif par question. Dépasser le temps n'est pas une faute : c'est un signal pour retravailler la méthode."
            />
            <ul className="mt-8 space-y-3">
              {speedTargets.map((target) => (
                <li key={target.level} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                  <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white">
                    <span className="font-heading text-lg leading-none font-extrabold tabular">{target.seconds}</span>
                    <span className="text-[0.65rem] text-white/70">sec</span>
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">Niveau {target.level.toLowerCase()}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand-sky" style={{ width: `${(target.seconds / 60) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex gap-2 rounded-xl bg-success-muted/60 p-4 text-sm">
              <Crosshair className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>
                <strong>Règle d&apos;or :</strong> ne sacrifiez jamais la précision à la vitesse.
              </span>
            </p>
          </div>

          <div className="rounded-3xl border bg-card p-6 sm:p-8">
            <h3 className="font-heading text-xl font-bold text-primary">Règles des examens blancs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Le format de référence est configurable par l&apos;administration.
            </p>
            <ul className="mt-6 space-y-4">
              {examRules.map((rule, index) => (
                <li key={rule} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-xs font-semibold text-primary tabular">
                    {index + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-secondary/50">
        <SectionHeading align="center" eyebrow="Questions fréquentes" title="Vous vous demandez peut-être…" />
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faq.map((item) => (
            <details key={item.q} className="group rounded-2xl border bg-card p-5 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-primary">
                {item.q}
                <span className="text-xl leading-none text-brand-sky transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
