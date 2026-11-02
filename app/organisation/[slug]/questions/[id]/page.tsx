import type { Metadata } from "next";
import { QuestionEditorScreen } from "@/features/questions/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Modifier la question" };

export default async function OrgEditQuestionPage({ params }: PageProps<"/organisation/[slug]/questions/[id]">) {
  const { slug, id } = await params;
  const { organization } = await requireOrgMember(slug, "questions:write");
  return (
    <QuestionEditorScreen
      bank={{ kind: "organization", slug: organization.slug }}
      scope={{ organizationId: organization.id }}
      questionId={id}
    />
  );
}
