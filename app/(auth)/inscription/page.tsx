import type { Metadata } from "next";
import Link from "next/link";
import { AuthMethodTabs } from "@/features/auth/components/auth-method-tabs";
import { EmailLinkForm } from "@/features/auth/components/email-link-form";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Inscription" };

export default function InscriptionPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Créez votre compte</h1>
      <p className="mt-2 text-muted-foreground">
        Gratuit. Le compte conserve votre historique, votre progression et vos participations aux évaluations.
      </p>
      <div className="mt-8">
        <AuthMethodTabs emailLink={<EmailLinkForm mode="register" />} password={<RegisterForm />} />
      </div>
      <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-primary underline-offset-4 hover:underline">
          Se connecter
        </Link>
        <br />
        Vous recrutez ?{" "}
        <Link href="/entreprise/inscription" className="font-semibold text-primary underline-offset-4 hover:underline">
          Créer un espace entreprise
        </Link>
      </p>
    </>
  );
}
