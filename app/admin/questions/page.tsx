import type { Metadata } from "next";
import { QuestionBankScreen } from "@/features/questions/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Banque Aptitude" };

export default async function AdminQuestionsPage({ searchParams }: PageProps<"/admin/questions">) {
  await requireSuperAdmin();
  return (
    <QuestionBankScreen
      bank={{ kind: "platform" }}
      scope={{ organizationId: null }}
      title="Banque Aptitude"
      description="Questions pédagogiques de la plateforme, utilisées pour l'entraînement des candidats. Contenus originaux : ne jamais les présenter comme des épreuves officielles."
      searchParams={await searchParams}
    />
  );
}
