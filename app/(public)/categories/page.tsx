import type { Metadata } from "next";
import { Clock, Search, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container, PageHero } from "@/components/shared/section";
import { CategoryIcon } from "@/components/shared/category-icon";
import { CtaBand } from "@/components/marketing/cta-band";
import { categories, categoryExamples, speedTargets } from "@/lib/content/categories";

export const metadata: Metadata = {
  title: "Catégories d'entraînement",
  description: "Les 8 catégories de questions psychotechniques numériques, avec méthode, gestion du temps et exemple corrigé.",
};

export default function CategoriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Catégories d'entraînement"
        title="8 catégories, 3 niveaux, une méthode pour chacune"
        description="Pour chaque famille de questions : comment la reconnaître, comment gérer son temps et un exemple résolu avec la méthode rapide."
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {speedTargets.map((target) => (
            <span
              key={target.level}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm"
            >
              <Clock className="size-3.5 text-brand-sky" aria-hidden />
              {target.level} · {target.seconds} s
            </span>
          ))}
        </div>
      </PageHero>

      <section className="py-12 sm:py-16">
        <Container className="grid gap-10 lg:grid-cols-[16rem_1fr]">
          <nav aria-label="Catégories" className="hidden lg:block">
            <ul className="sticky top-24 space-y-1">
              {categories.map((category) => (
                <li key={category.slug}>
                  <a
                    href={`#${category.slug}`}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <CategoryIcon name={category.icon} className="size-4" />
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-6">
            {categories.map((category, index) => {
              const example = categoryExamples[category.slug];
              return (
                <article
                  key={category.slug}
                  id={category.slug}
                  className="scroll-mt-24 overflow-hidden rounded-3xl border bg-card"
                >
                  <header className="flex flex-wrap items-center gap-4 border-b p-5 sm:p-7">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-white">
                      <CategoryIcon name={category.icon} className="size-6" />
                    </span>
                    <div className="flex-1">
                      <p className="font-mono text-xs font-semibold text-muted-foreground tabular">
                        Catégorie {String(index + 1).padStart(2, "0")}
                      </p>
                      <h2 className="font-heading text-xl font-bold text-primary sm:text-2xl">{category.name}</h2>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="success">Facile</Badge>
                      <Badge variant="sky">Intermédiaire</Badge>
                      <Badge variant="default">Difficile</Badge>
                    </div>
                  </header>

                  <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-2">
                    <div className="space-y-5">
                      <p className="text-muted-foreground">{category.description}</p>
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Search className="size-4 text-brand-sky" aria-hidden /> Comment la reconnaître
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed">{category.recognitionGuide}</p>
                      </div>
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Clock className="size-4 text-brand-sky" aria-hidden /> Gestion du temps
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed">{category.timeManagement}</p>
                      </div>
                    </div>

                    {example && (
                      <div className="rounded-2xl bg-secondary/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-sky">Exemple résolu</p>
                        <p className="mt-2 font-medium text-primary">{example.question}</p>
                        <p className="mt-4 inline-flex items-center rounded-lg bg-success-muted px-2.5 py-1 text-sm font-semibold text-success">
                          Réponse : {example.answer}
                        </p>
                        <div className="mt-4 flex gap-2 text-sm leading-relaxed">
                          <Zap className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                          <p>
                            <span className="font-semibold">Méthode rapide : </span>
                            {example.quickMethod}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <CtaBand
        title="Travaillez ces catégories avec des exercices corrigés"
        description="Dans votre espace, choisissez une catégorie, un niveau et le nombre de questions."
      />
    </>
  );
}
