import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { DesktopNav } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo inverted />
          <DesktopNav />
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/connexion"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white sm:block"
          >
            Connexion
          </Link>
          <Button asChild variant="sky" size="lg" className="hidden px-3.5 sm:inline-flex">
            <Link href="/entrainement">
              S&apos;entraîner <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
