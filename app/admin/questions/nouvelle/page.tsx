import type { Metadata } from "next";
import { QuestionEditorScreen } from "@/features/questions/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Nouvelle question" };

export default async function AdminNewQuestionPage() {
  await requireSuperAdmin();
  return <QuestionEditorScreen bank={{ kind: "platform" }} scope={{ organizationId: null }} />;
}
