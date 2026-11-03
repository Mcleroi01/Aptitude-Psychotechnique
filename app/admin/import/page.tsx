import type { Metadata } from "next";
import { ImportListScreen } from "@/features/imports/components/screens";
import { requireSuperAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Importer des questions" };

export default async function AdminImportPage() {
  await requireSuperAdmin();
  return <ImportListScreen bank={{ kind: "platform" }} scope={{ organizationId: null }} />;
}
