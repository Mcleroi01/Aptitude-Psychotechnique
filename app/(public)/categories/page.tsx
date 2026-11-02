import type { Metadata } from "next";
import { Container, PageHero } from "@/components/shared/section";
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
        eyebrow="Catégories"
        title="8 catégories, 3 niveaux, une méthode pour chacune"
        description="Pour chaque famille de questions : comment la reconnaître, comment gérer son temps et un exemple résolu avec la méthode rapide."
      >
        <p className="mt-8 text-sm text-white/55">
          Temps cible par question :{" "}
          {speedTargets.map((t) => `${t.level.toLowerCase()} ${t.seconds} s`).join(" · ")}
        </p>
      </PageHero>

      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-16">
          <nav aria-label="Catégories" className="hidden lg:block">
            <ol className="sticky top-24 space-y-0.5 border-l">
              {categories.map((category, index) => (
                <li key={category.slug}>
                  <a
                    href={`#${category.slug}`}
                    className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    <span className="font-mono text-xs tabular">{String(index + 1).padStart(2, "0")}</span>
                    {category.name}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="divide-y border-y">
            {categories.map((category, index) => {
              const example = categoryExamples[category.slug];
              return (
                <article key={category.slug} id={category.slug} className="scroll-mt-24 py-12 first:pt-10">
                  <p className="font-mono text-sm text-muted-foreground tabular">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{category.name}</h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>

                  <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <dl className="space-y-6">
                      <div>
                        <dt className="text-sm font-semibold">Comment la reconnaître</dt>
                        <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
                          {category.recognitionGuide}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-semibold">Gestion du temps</dt>
                        <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
                          {category.timeManagement}
                        </dd>
                      </div>
                    </dl>

                    {example && (
                      <div className="rounded-xl border bg-secondary/60 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Exemple résolu
                        </p>
                        <p className="mt-3 font-medium">{example.question}</p>
                        <p className="mt-4 text-sm">
                          <span className="text-muted-foreground">Réponse : </span>
                          <span className="font-semibold text-success">{example.answer}</span>
                        </p>
                        <p className="mt-3 border-t pt-3 text-sm leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">Méthode rapide. </span>
                          {example.quickMethod}
                        </p>
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
