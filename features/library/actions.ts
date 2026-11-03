"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/errors";
import { assertSuperAdmin } from "@/lib/guards";
import { documentSchema } from "@/lib/library";
import { UPLOAD_RULES } from "@/lib/storage-rules";
import { createDocument, deleteDocument, updateDocument } from "@/services/document.service";
import { bankStoragePrefix, createUploadTarget } from "@/services/storage.service";

const id = z.string().min(1).max(40);

function refresh() {
  revalidatePath("/admin/bibliotheque");
  revalidatePath("/bibliotheque");
}

/** URL d'envoi direct d'un document de bibliothèque (PDF ou image, 10 Mo). */
export async function requestLibraryUploadAction(file: unknown): Promise<ActionResult<{ path: string; uploadUrl: string }>> {
  return runAction(async () => {
    await assertSuperAdmin();
    const { type, size } = z.object({ type: z.string().max(100), size: z.number().int().nonnegative() }).parse(file);
    return createUploadTarget(bankStoragePrefix(null), "attachment", { type, size }, "library");
  });
}

const createSchema = z.object({
  values: documentSchema,
  storagePath: z.string().min(1).max(300),
  fileType: z.enum(Object.keys(UPLOAD_RULES.attachment.types) as [string, ...string[]]),
  fileSize: z.number().int().positive().max(UPLOAD_RULES.attachment.maxBytes),
});

export async function createDocumentAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await assertSuperAdmin();
    const { values, ...file } = createSchema.parse(input);
    await createDocument(user.id, { ...values, ...file });
    refresh();
  });
}

export async function updateDocumentAction(documentId: unknown, values: unknown): Promise<ActionResult> {
  return runAction(async () => {
    await assertSuperAdmin();
    await updateDocument(id.parse(documentId), documentSchema.parse(values));
    refresh();
  });
}

export async function deleteDocumentAction(documentId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    await assertSuperAdmin();
    await deleteDocument(id.parse(documentId));
    refresh();
  });
}
