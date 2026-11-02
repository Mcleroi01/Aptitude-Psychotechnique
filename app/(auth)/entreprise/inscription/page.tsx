import type { Metadata } from "next";
import { CompanyRegisterForm } from "@/features/auth/components/company-register-form";
import { CreateOrganizationForm } from "@/features/auth/components/create-organization-form";
import { getSessionUser } from "@/lib/guards";

export const metadata: Metadata = { title: "Espace entreprise" };

export default async function EntrepriseInscriptionPage() {
  const user = await getSessionUser();

  return (
    <>
      <h1 className="text-3xl font-semibold">Créez votre espace organisation</h1>
      <p className="mt-2 text-muted-foreground">
        Composez vos questionnaires, configurez vos évaluations et invitez vos candidats.
      </p>
      <div className="mt-8">
        {user ? (
          <>
            <p className="mb-5 text-sm text-muted-foreground">
              Connecté en tant que <strong className="font-medium text-foreground">{user.email}</strong> : vous
              deviendrez propriétaire de la nouvelle organisation.
            </p>
            <CreateOrganizationForm />
          </>
        ) : (
          <CompanyRegisterForm />
        )}
      </div>
    </>
  );
}
