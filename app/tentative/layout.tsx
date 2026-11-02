import { Logo } from "@/components/layout/logo";

/** Cadre épuré pendant une épreuve : pas de navigation qui détourne l'attention. */
export default function TentativeLayout({ children }: LayoutProps<"/tentative">) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Logo inverted />
        </div>
      </header>
      <main className="w-full flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
