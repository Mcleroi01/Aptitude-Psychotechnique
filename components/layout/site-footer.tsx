import Link from "next/link";
import { Info } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { categories } from "@/lib/content/categories";
import { publicNav } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo inverted />
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">{siteConfig.description}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Plateforme</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-primary-foreground/70 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/connexion" className="text-primary-foreground/70 transition-colors hover:text-white">
                  Connexion
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Catégories</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories#${category.slug}`}
                    className="text-primary-foreground/70 transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-primary-foreground/80">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-sky" aria-hidden />
          <p>
            {siteConfig.disclaimer} Les exercices proposés sont des contenus originaux conçus pour l&apos;entraînement ; ils
            ne reproduisent pas les épreuves officielles.
          </p>
        </div>

        <p className="mt-8 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
