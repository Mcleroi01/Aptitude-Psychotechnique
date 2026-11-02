"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoMark } from "@/components/layout/logo";
import { MobileNavLinks } from "@/components/layout/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Ouvrir le menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-sm gap-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <LogoMark className="size-7" /> Menu
          </SheetTitle>
          <SheetDescription className="sr-only">Navigation du site</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col justify-between gap-6 p-4">
          <MobileNavLinks onNavigate={close} />
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" size="xl">
              <Link href="/connexion" onClick={close}>
                Connexion
              </Link>
            </Button>
            <Button asChild size="xl">
              <Link href="/inscription" onClick={close}>
                Commencer la préparation
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
