import type { Metadata } from "next";
import { ImportJobScreen } from "@/features/imports/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Vérification de l'import" };

export default async function AdminImportJobPage({ params }: PageProps<"/admin/import/[jobId]">) {
  await requireSuperAdmin();
  const { jobId } = await params;
  return <ImportJobScreen bank={{ kind: "platform" }} scope={{ organizationId: null }} jobId={jobId} />;
}
