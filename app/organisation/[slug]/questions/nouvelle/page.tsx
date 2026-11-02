import type { Metadata } from "next";
import { QuestionEditorScreen } from "@/features/questions/components/screens";
import { requireOrgMember } from "@/lib/guards";

export const metadata: Metadata = { title: "Nouvelle question" };

export default async function OrgNewQuestionPage({ params }: PageProps<"/organisation/[slug]/questions/nouvelle">) {
  const { slug } = await params;
  const { organization } = await requireOrgMember(slug, "questions:write");
  return (
    <QuestionEditorScreen bank={{ kind: "organization", slug: organization.slug }} scope={{ organizationId: organization.id }} />
  );
}
