import { siteConfig } from "@/lib/site";

// Page d'accueil provisoire (phase 1) — remplacée par la page publique complète en phase 2.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-primary px-4 py-24 text-center text-primary-foreground">
      <p className="text-sm font-medium uppercase tracking-widest text-brand-sky">Préparation aux tests numériques</p>
      <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{siteConfig.name}</h1>
      <p className="mt-6 max-w-xl text-base text-primary-foreground/80">{siteConfig.description}</p>
      <p className="mt-10 rounded-full border border-white/15 px-4 py-2 text-sm text-primary-foreground/70">
        Plateforme en construction : la page d&apos;accueil complète arrive en phase 2.
      </p>
      <p className="mt-16 max-w-md text-xs text-primary-foreground/50">{siteConfig.disclaimer}</p>
    </main>
  );
}
