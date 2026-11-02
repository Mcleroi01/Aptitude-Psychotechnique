import { BarChart3, CheckCircle2, Timer, Zap } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/lib/site";

const highlights = [
  { icon: Zap, text: "Méthodes rapides et astuces de calcul mental" },
  { icon: Timer, text: "Examens blancs de 15 questions en 15 minutes" },
  { icon: CheckCircle2, text: "Corrections détaillées pour chaque question" },
  { icon: BarChart3, text: "Suivi de votre progression par catégorie" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="hero-surface relative hidden flex-col justify-between p-10 text-white lg:flex xl:p-14">
        <Logo inverted />
        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold text-balance xl:text-4xl">
            Chaque minute d&apos;entraînement vous rapproche de la réussite.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-4 text-brand-sky" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-md text-xs text-white/50">{siteConfig.disclaimer}</p>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-muted-foreground lg:hidden">{siteConfig.disclaimer}</p>
      </main>
    </div>
  );
}
