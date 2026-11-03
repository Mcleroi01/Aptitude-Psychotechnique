import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireSuperAdmin } from "@/lib/guards";
import { getPlatformStats } from "@/services/admin.service";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  await requireSuperAdmin();
  const stats = await getPlatformStats();

  const tiles = [
    { label: "Comptes", value: stats.users, hint: `${stats.newUsers} nouveaux sur 30 jours`, href: "/admin/comptes" },
    { label: "Organisations", value: stats.organizations, hint: `${stats.suspended} suspendue(s)`, href: "/admin/organisations" },
    { label: "Tentatives (30 jours)", value: stats.attempts, hint: `dont ${stats.guestAttempts} sans compte` },
    { label: "Campagnes en cours", value: stats.campaigns },
    { label: "Questions Aptitude publiées", value: stats.platformQuestions, href: "/admin/questions" },
    { label: "Questions privées des organisations", value: stats.privateQuestions },
  ];

  return (
    <>
      <h1 className="text-3xl font-semibold">Administration</h1>
      <p className="mt-2 text-muted-foreground">Vue d&apos;ensemble de la plateforme.</p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const body = (
            <>
              <dt className="text-sm text-muted-foreground">{tile.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tabular">{tile.value}</dd>
              {tile.hint && <dd className="text-xs text-muted-foreground">{tile.hint}</dd>}
            </>
          );
          return tile.href ? (
            <Link key={tile.label} href={tile.href} className="group relative rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
              {body}
              <ArrowRight className="absolute top-5 right-5 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ) : (
            <div key={tile.label} className="rounded-xl border bg-card p-5">
              {body}
            </div>
          );
        })}
      </dl>
    </>
  );
}
