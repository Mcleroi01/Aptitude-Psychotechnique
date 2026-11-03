import { AppShell } from "@/components/layout/app-shell";
import { requireSuperAdmin } from "@/lib/guards";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireSuperAdmin();
  const nav = [
    { href: "/admin", label: "Vue d'ensemble", exact: true },
    { href: "/admin/questions", label: "Banque Aptitude" },
    { href: "/admin/categories", label: "Catégories" },
    { href: "/admin/import", label: "Import" },
    { href: "/admin/evaluations", label: "Évaluations" },
  ];
  return (
    <AppShell user={user} context="Administration" nav={nav}>
      {children}
    </AppShell>
  );
}
