import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmLoginLink } from "@/features/auth/components/confirm-login-link";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = { title: "Lien de connexion", robots: { index: false } };

export default async function LienConnexionPage({ searchParams }: PageProps<"/connexion/lien">) {
  const { token, callbackUrl } = await searchParams;
  const value = typeof token === "string" ? token : undefined;

  return (
    <>
      <h1 className="text-3xl font-semibold">Connexion</h1>
      {value ? (
        <>
          <p className="mt-2 text-muted-foreground">
            Cliquez pour accéder à votre espace. Si vous n&apos;avez pas encore de compte, il est créé maintenant.
          </p>
          <div className="mt-8">
            <ConfirmLoginLink token={value} callbackUrl={safeCallbackUrl(typeof callbackUrl === "string" ? callbackUrl : undefined)} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-muted-foreground">Ce lien est incomplet. Demandez un nouveau lien de connexion.</p>
          <Button asChild size="xl" className="mt-8 w-full">
            <Link href="/connexion">Recevoir un nouveau lien</Link>
          </Button>
        </>
      )}
    </>
  );
}
