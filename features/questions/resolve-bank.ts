import "server-only";
import { assertOrgPermission, assertSuperAdmin } from "@/lib/guards";
import { bankRefSchema } from "@/features/questions/bank";
import type { BankScope } from "@/services/question.service";
import { bankStoragePrefix } from "@/services/storage.service";

/**
 * Vérifie les droits sur la banque désignée et renvoie son périmètre :
 * banque Aptitude → super-administrateur ; banque privée → membre autorisé.
 */
export async function resolveBank(ref: unknown) {
  const bank = bankRefSchema.parse(ref);
  if (bank.kind === "platform") {
    const user = await assertSuperAdmin();
    const scope: BankScope = { organizationId: null };
    return { user, scope, bank, prefix: bankStoragePrefix(null) };
  }
  const { user, organization } = await assertOrgPermission(bank.slug, "questions:write");
  const scope: BankScope = { organizationId: organization.id };
  return { user, scope, bank, prefix: bankStoragePrefix(organization.id) };
}
