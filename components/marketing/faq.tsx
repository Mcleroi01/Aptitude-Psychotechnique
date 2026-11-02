import { ChevronDown } from "lucide-react";
import { Section, SectionHeading } from "@/components/shared/section";

export type FaqItem = { q: string; a: string };

export const generalFaq: FaqItem[] = [
  {
    q: "Les questions proviennent-elles du vrai test ?",
    a: "Non. Toutes les questions sont originales et conçues pour l'entraînement à partir des types d'exercices courants. Aucune n'est présentée comme issue d'une épreuve officielle.",
  },
  {
    q: "La plateforme est-elle liée à un employeur ?",
    a: "Non. C'est une plateforme indépendante, sans lien avec aucun employeur ni organisme de recrutement. Les entreprises peuvent l'utiliser pour leurs propres évaluations.",
  },
  {
    q: "Faut-il un compte pour s'entraîner ?",
    a: "Non. Entraînement et examens blancs sont accessibles librement. Un compte gratuit, créé en un clic depuis un lien reçu par e-mail, conserve votre historique et votre progression.",
  },
  {
    q: "Puis-je utiliser la plateforme sur mon téléphone ?",
    a: "Oui. Toutes les pages, y compris le simulateur d'examen, fonctionnent sur ordinateur, tablette et smartphone.",
  },
  {
    q: "Dois-je privilégier la vitesse ou la justesse ?",
    a: "La justesse d'abord. Une réponse rapide mais fausse ne rapporte rien. La vitesse vient quand la méthode est maîtrisée.",
  },
];

export function FaqSection({ items = generalFaq, title = "Questions fréquentes" }: { items?: FaqItem[]; title?: string }) {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <SectionHeading
          title={title}
          description="Vous ne trouvez pas votre réponse ? La page Fonctionnement détaille le déroulement de la préparation."
        />
        <div className="divide-y border-y">
          {items.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium text-foreground">
                {item.q}
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 pr-10 text-[0.95rem] leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
