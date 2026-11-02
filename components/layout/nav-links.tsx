"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
      {publicNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary",
            "aria-[current=page]:text-primary aria-[current=page]:bg-secondary",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation mobile" className="flex flex-col gap-1">
      {publicNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:text-primary"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
