import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export const metadata: Metadata = { title: "Confirmation de l'adresse e-mail", robots: { index: false } };

export default async function VerificationEmailPage({ searchParams }: PageProps<"/verification-email">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : undefined;

  return (
    <>
      <h1 className="text-3xl font-semibold">Confirmez votre adresse</h1>
      {value ? (
        <>
          <p className="mt-2 text-muted-foreground">Cliquez sur le bouton pour finaliser la confirmation.</p>
          <div className="mt-8">
            <VerifyEmailForm token={value} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-muted-foreground">
            Ce lien est incomplet. Ouvrez le lien reçu par e-mail ou demandez-en un nouveau depuis votre espace.
          </p>
          <Button asChild size="xl" className="mt-8 w-full">
            <Link href="/espace">Aller à mon espace</Link>
          </Button>
        </>
      )}
    </>
  );
}
