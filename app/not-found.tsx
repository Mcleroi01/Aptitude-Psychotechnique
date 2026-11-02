import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-sm font-semibold text-brand-sky">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        La page demandée n&apos;existe pas ou a été déplacée.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </main>
  );
}
