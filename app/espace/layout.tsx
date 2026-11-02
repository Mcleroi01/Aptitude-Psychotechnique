import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/guards";

export default async function EspaceLayout({ children }: LayoutProps<"/espace">) {
  const user = await requireUser();
  const nav = [
    { href: "/espace", label: "Mon espace", exact: true },
    { href: "/espace/entrainement", label: "S'entraîner" },
  ];
  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
