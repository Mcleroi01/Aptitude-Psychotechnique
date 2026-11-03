"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/errors";
import { MAX_IMPORT_ROWS } from "@/lib/imports/rows";
import { bankPaths } from "@/features/questions/bank";
import { resolveBank } from "@/features/questions/resolve-bank";
import {
  addImportItem,
  cancelImportJob,
  commitImportJob,
  createDocumentJob,
  createTabularJob,
  setImportItemStatus,
  updateImportItem,
} from "@/services/import.service";

const id = z.string().min(1).max(40);
const cell = z.string().max(5000).optional();

const tabularSchema = z.object({
  source: z.enum(["CSV", "XLSX"]),
  fileName: z.string().trim().min(1).max(200),
  createMissingCategories: z.boolean(),
  rows: z.array(z.record(z.string().max(40), z.union([cell, z.number()]))).max(MAX_IMPORT_ROWS + 1),
});

export async function createTabularImportAction(bankRef: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { user, scope, bank } = await resolveBank(bankRef);
    const data = tabularSchema.parse(input);
    const rows = data.rows.map((row) => {
      const { _line, ...rest } = row;
      return { ...(rest as Record<string, string>), _line: Number(_line) || 0 };
    });
    const job = await createTabularJob(scope, user.id, { ...data, rows });
    redirect(bankPaths(bank).importJob(job.id));
  });
}

const documentSchema = z.object({
  source: z.enum(["PDF", "IMAGE"]),
  fileName: z.string().trim().min(1).max(200),
  storagePath: z.string().min(1).max(300),
});

export async function createDocumentImportAction(bankRef: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { user, scope, bank } = await resolveBank(bankRef);
    const job = await createDocumentJob(scope, user.id, documentSchema.parse(input));
    redirect(bankPaths(bank).importJob(job.id));
  });
}

async function mutate<T>(bankRef: unknown, jobId: unknown, fn: (ctx: Awaited<ReturnType<typeof resolveBank>>) => Promise<T>) {
  const ctx = await resolveBank(bankRef);
  const result = await fn(ctx);
  const paths = bankPaths(ctx.bank);
  revalidatePath(paths.imports);
  if (typeof jobId === "string") revalidatePath(paths.importJob(jobId));
  return result;
}

export async function updateImportItemAction(bankRef: unknown, jobId: unknown, itemId: unknown, values: unknown, approve: unknown): Promise<ActionResult<string[]>> {
  return runAction(() => mutate(bankRef, jobId, ({ scope }) => updateImportItem(scope, id.parse(itemId), values, z.boolean().parse(approve))));
}

export async function addImportItemAction(bankRef: unknown, jobId: unknown, values: unknown, approve: unknown): Promise<ActionResult<string[]>> {
  return runAction(() => mutate(bankRef, jobId, ({ scope }) => addImportItem(scope, id.parse(jobId), values, z.boolean().parse(approve))));
}

export async function setImportItemStatusAction(bankRef: unknown, jobId: unknown, itemId: unknown, status: unknown): Promise<ActionResult> {
  return runAction(() =>
    mutate(bankRef, jobId, ({ scope, user }) =>
      setImportItemStatus(scope, user.id, id.parse(itemId), z.enum(["APPROVED", "REJECTED", "PENDING"]).parse(status)),
    ),
  );
}

export async function commitImportAction(bankRef: unknown, jobId: unknown, publish: unknown): Promise<ActionResult<{ created: number }>> {
  return runAction(() =>
    mutate(bankRef, jobId, async ({ scope, user, bank }) => {
      const result = await commitImportJob(scope, user.id, id.parse(jobId), { publish: z.boolean().parse(publish) });
      revalidatePath(bankPaths(bank).questions);
      return result;
    }),
  );
}

export async function cancelImportAction(bankRef: unknown, jobId: unknown): Promise<ActionResult> {
  return runAction(() => mutate(bankRef, jobId, ({ scope }) => cancelImportJob(scope, id.parse(jobId))));
}
