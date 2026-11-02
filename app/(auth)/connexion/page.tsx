import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackUrl(Array.isArray(callbackUrl) ? callbackUrl[0] : toPath(callbackUrl));

  return (
    <>
      <h1 className="text-3xl font-semibold">Bon retour !</h1>
      <p className="mt-2 text-muted-foreground">Connectez-vous pour reprendre votre préparation.</p>
      <div className="mt-8">
        <LoginForm callbackUrl={target} />
      </div>
    </>
  );
}

/** Auth.js transmet une URL absolue : on n'en garde que le chemin. */
function toPath(value: string | undefined) {
  if (!value) return undefined;
  if (value.startsWith("/")) return value;
  return URL.canParse(value) ? new URL(value).pathname + new URL(value).search : undefined;
}
