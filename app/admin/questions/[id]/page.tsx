import type { Metadata } from "next";
import { QuestionEditorScreen } from "@/features/questions/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Modifier la question" };

export default async function AdminEditQuestionPage({ params }: PageProps<"/admin/questions/[id]">) {
  await requireSuperAdmin();
  const { id } = await params;
  return <QuestionEditorScreen bank={{ kind: "platform" }} scope={{ organizationId: null }} questionId={id} />;
}
