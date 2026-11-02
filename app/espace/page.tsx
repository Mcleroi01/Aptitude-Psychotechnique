import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/lib/guards";

export const metadata: Metadata = { title: "Mon espace" };

// Espace provisoire : le tableau de bord complet est livré en phase 4.
export default async function EspacePage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="lg">
              <LogOut data-icon="inline-start" /> Déconnexion
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <p className="text-sm font-semibold text-brand-sky">Espace candidat</p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary">Bonjour {user.name} 👋</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Votre compte est actif. Le tableau de bord, l&apos;entraînement et les examens blancs seront disponibles ici dans
          les prochaines phases.
        </p>
      </main>
    </div>
  );
}
