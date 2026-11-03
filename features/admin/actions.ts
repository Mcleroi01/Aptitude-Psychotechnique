"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/errors";
import { assertSuperAdmin } from "@/lib/guards";
import { changeAccount, setOrganizationStatus } from "@/services/admin.service";

const id = z.string().min(1).max(40);

export async function setOrganizationStatusAction(organizationId: unknown, status: unknown): Promise<ActionResult> {
  return runAction(async () => {
    await assertSuperAdmin();
    await setOrganizationStatus(id.parse(organizationId), z.enum(["ACTIVE", "SUSPENDED"]).parse(status));
    revalidatePath("/admin/organisations");
    revalidatePath("/admin");
  });
}

const changeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("activate") }),
  z.object({ kind: z.literal("deactivate") }),
  z.object({ kind: z.literal("role"), role: z.enum(["SUPER_ADMIN", "USER"]) }),
]);

export async function changeAccountAction(userId: unknown, change: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const actor = await assertSuperAdmin();
    await changeAccount(actor.id, id.parse(userId), changeSchema.parse(change));
    revalidatePath("/admin/comptes");
  });
}
