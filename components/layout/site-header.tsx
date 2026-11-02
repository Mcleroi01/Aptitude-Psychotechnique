import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { DesktopNav } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <DesktopNav />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="lg" className="hidden sm:inline-flex">
            <Link href="/connexion">Connexion</Link>
          </Button>
          <Button asChild size="lg" className="hidden px-4 sm:inline-flex">
            <Link href="/inscription">Commencer</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
