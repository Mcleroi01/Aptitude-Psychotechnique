import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/guards";

export const metadata: Metadata = { title: "Organisation suspendue" };

export default async function OrganisationSuspenduePage() {
  await requireUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Organisation suspendue</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        L&apos;accès à cet espace a été suspendu par l&apos;administration de la plateforme. Vos autres espaces restent
        accessibles.
      </p>
      <Button asChild className="mt-8">
        <Link href="/espace">Retour à mon espace</Link>
      </Button>
    </main>
  );
}
