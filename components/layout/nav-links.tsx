"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNav } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden items-center gap-0.5 lg:flex">
      {publicNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
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
    <nav aria-label="Navigation mobile" className="flex flex-col">
      {publicNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="border-b py-3.5 text-base font-medium text-foreground aria-[current=page]:text-primary aria-[current=page]:font-semibold"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
