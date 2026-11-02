"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/errors";
import { assertOrgPermission } from "@/lib/guards";
import { gradeAnswer } from "@/services/results.service";

const gradeSchema = z.object({
  score: z.number().min(0, "Note positive ou nulle").max(1000),
  feedback: z.string().trim().max(2000, "2 000 caractères maximum"),
});

export async function gradeAnswerAction(slug: unknown, answerId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { user, organization } = await assertOrgPermission(z.string().min(1).max(60).parse(slug), "answers:grade");
    await gradeAnswer(organization.id, user.id, z.string().min(1).max(40).parse(answerId), gradeSchema.parse(input));
    revalidatePath(`/organisation/${organization.slug}`, "layout");
  });
}
