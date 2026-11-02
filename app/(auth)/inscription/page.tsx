import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Inscription" };

export default function InscriptionPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-primary">Créez votre compte</h1>
      <p className="mt-2 text-muted-foreground">
        Gratuit. Accédez à l&apos;entraînement, aux examens blancs et à la bibliothèque.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </>
  );
}
