import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppNav, type AppNavItem } from "@/components/layout/app-nav";
import { Logo } from "@/components/layout/logo";
import { logoutAction } from "@/features/auth/actions";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";
import { isEmailVerified } from "@/services/email-verification.service";
import type { SessionUser } from "@/types";

/** Cadre des espaces connectés (candidat, organisation, administration). */
export async function AppShell({
  user,
  context,
  nav = [],
  children,
}: {
  user: SessionUser;
  /** Libellé affiché à côté du logo (ex. nom de l'organisation) */
  context?: string;
  nav?: AppNavItem[];
  children: React.ReactNode;
}) {
  const verified = await isEmailVerified(user.id);

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="bg-ink text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Logo inverted />
            {context && (
              <span className="hidden truncate border-l border-white/15 pl-4 text-sm text-white/70 sm:block">
                {context}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/60 md:block">{user.name}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="inverse" size="sm">
                <LogOut data-icon="inline-start" /> Déconnexion
              </Button>
            </form>
          </div>
        </div>
        {nav.length > 0 && <AppNav items={nav} />}
      </header>
      {!verified && <EmailVerificationBanner email={user.email} />}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
