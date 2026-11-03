import type { Metadata } from "next";
import Link from "next/link";
import { AuthMethodTabs } from "@/features/auth/components/auth-method-tabs";
import { EmailLinkForm } from "@/features/auth/components/email-link-form";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackUrl(Array.isArray(callbackUrl) ? callbackUrl[0] : toPath(callbackUrl));

  return (
    <>
      <h1 className="text-3xl font-semibold">Bon retour !</h1>
      <p className="mt-2 text-muted-foreground">
        Recevez un lien de connexion par e-mail, ou utilisez votre mot de passe. Sans compte, le lien en crée un.
      </p>
      <div className="mt-8">
        <AuthMethodTabs
          emailLink={<EmailLinkForm mode="login" callbackUrl={target} />}
          password={<LoginForm callbackUrl={target} />}
        />
      </div>
      <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-primary underline-offset-4 hover:underline">
          Créer un compte
        </Link>
        <br />
        Envie de vous entraîner d&apos;abord ?{" "}
        <Link href="/entrainement" className="font-semibold text-primary underline-offset-4 hover:underline">
          S&apos;entraîner sans compte
        </Link>
      </p>
    </>
  );
}

/** Auth.js transmet une URL absolue : on n'en garde que le chemin. */
function toPath(value: string | undefined) {
  if (!value) return undefined;
  if (value.startsWith("/")) return value;
  return URL.canParse(value) ? new URL(value).pathname + new URL(value).search : undefined;
}
