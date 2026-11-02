import { Check } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/lib/site";

const highlights = [
  "Exercices corrigés par catégorie et par niveau",
  "Évaluations en une ou plusieurs épreuves",
  "Durées, barèmes et seuils configurables",
  "Chronométrage contrôlé par le serveur",
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex xl:p-14">
        <Logo inverted />
        <div className="max-w-md">
          <h2 className="text-3xl leading-tight font-semibold text-balance xl:text-4xl">
            Préparez, évaluez et recrutez avec méthode.
          </h2>
          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {highlights.map((text) => (
              <li key={text} className="flex items-center gap-3 py-3.5 text-white/75">
                <Check className="size-4 shrink-0 text-brand-sky" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-white/45">{siteConfig.disclaimer}</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="-mx-4 -mt-6 bg-ink px-4 py-4 sm:-mx-8 sm:px-8 lg:hidden">
          <Logo inverted />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
        <p className="text-center text-xs text-muted-foreground lg:hidden">{siteConfig.disclaimer}</p>
      </main>
    </div>
  );
}
