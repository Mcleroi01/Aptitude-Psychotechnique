import { z } from "zod";

/**
 * Désigne une banque depuis le navigateur. Ce n'est qu'une indication : le
 * serveur la résout avec les droits de l'utilisateur (resolveBank).
 */
export const bankRefSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("platform") }),
  z.object({ kind: z.literal("organization"), slug: z.string().min(1).max(60) }),
]);

export type BankRef = z.infer<typeof bankRefSchema>;

/** Routes de la banque, pour construire les liens côté pages et composants. */
export function bankPaths(ref: BankRef) {
  const root = ref.kind === "platform" ? "/admin" : `/organisation/${ref.slug}`;
  return {
    questions: `${root}/questions`,
    newQuestion: `${root}/questions/nouvelle`,
    question: (id: string) => `${root}/questions/${id}`,
    categories: `${root}/categories`,
    assessments: `${root}/evaluations`,
    assessment: (id: string) => `${root}/evaluations/${id}`,
    assessmentPreview: (id: string) => `${root}/evaluations/${id}/apercu`,
  };
}
