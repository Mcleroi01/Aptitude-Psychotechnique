import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/shared/category-icon";
import { categories } from "@/lib/content/categories";

export function CategoryGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category, index) => (
        <li key={category.slug}>
          <Link
            href={`/categories#${category.slug}`}
            className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand-sky/60 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <CategoryIcon name={category.icon} />
              </span>
              <span className="font-mono text-xs font-semibold text-muted-foreground tabular">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 font-heading text-base font-bold text-primary">{category.name}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-sky">
              Voir la méthode
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
