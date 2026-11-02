import type { Metadata } from "next";
import { QuestionBankScreen } from "@/features/questions/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Banque de questions" };

export default async function OrgQuestionsPage({ params, searchParams }: PageProps<"/organisation/[slug]/questions">) {
  const { slug } = await params;
  const { organization } = await requireOrgMember(slug, "questions:write");
  return (
    <QuestionBankScreen
      bank={{ kind: "organization", slug: organization.slug }}
      scope={{ organizationId: organization.id }}
      title="Banque de questions"
      description="Questions privées de votre organisation, réutilisables dans toutes vos évaluations. Elles ne sont visibles que par vos membres."
      searchParams={await searchParams}
    />
  );
}
