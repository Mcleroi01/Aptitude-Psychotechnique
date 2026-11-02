import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { categories } from "@/lib/content/categories";
import { publicNav } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-white/55 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo inverted />
            <p className="mt-5 text-sm leading-relaxed text-white/55">
              Entraînement aux tests psychotechniques et évaluations de recrutement configurables pour les
              organisations.
            </p>
          </div>
          <FooterColumn title="Plateforme" links={[...publicNav]} />
          <FooterColumn
            title="Catégories"
            links={categories.slice(0, 4).map((c) => ({ href: `/categories#${c.slug}`, label: c.name }))}
          />
          <FooterColumn
            title="Compte"
            links={[
              { href: "/inscription", label: "Créer un compte" },
              { href: "/entreprise/inscription", label: "Espace entreprise" },
              { href: "/connexion", label: "Connexion" },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/45 sm:flex-row sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            {siteConfig.disclaimer} Les exercices sont des contenus originaux d&apos;entraînement et ne reproduisent pas
            les épreuves officielles.
          </p>
          <p className="shrink-0">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
