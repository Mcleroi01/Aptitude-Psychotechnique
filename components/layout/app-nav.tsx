"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type AppNavItem = { href: string; label: string; exact?: boolean };

export function AppNav({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation de l'espace" className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6 lg:px-8">
      <ul className="flex gap-6 text-sm">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block border-b-2 py-3 whitespace-nowrap transition-colors",
                  active ? "border-brand-sky text-white" : "border-transparent text-white/60 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
