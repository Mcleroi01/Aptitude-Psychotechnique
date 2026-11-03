import { emailSchema } from "@/schemas/auth";

/**
 * Lecture d'une liste de candidats collée par le recruteur, une personne par
 * ligne : « adresse », « Nom <adresse> », « adresse ; Nom » ou « Nom ; adresse ».
 * Fonction pure : doublons fusionnés, lignes invalides renvoyées telles quelles.
 */
export type ParsedInvitee = { email: string; name: string | null };

export const MAX_INVITEES_PER_BATCH = 200;

export function parseInvitees(text: string): { invitees: ParsedInvitee[]; invalid: string[] } {
  const invitees = new Map<string, ParsedInvitee>();
  const invalid: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    let email = "";
    let name: string | null = null;
    const angle = line.match(/^(.*)<([^>]+)>\s*$/);
    if (angle) {
      email = angle[2];
      name = angle[1].replace(/["']/g, "").trim() || null;
    } else {
      const parts = line.split(/[;,\t]/).map((p) => p.trim()).filter(Boolean);
      const emailPart = parts.find((p) => p.includes("@")) ?? "";
      email = emailPart;
      name = parts.filter((p) => p !== emailPart).join(" ").trim() || null;
    }

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      invalid.push(line);
      continue;
    }
    const existing = invitees.get(parsed.data);
    invitees.set(parsed.data, { email: parsed.data, name: name?.slice(0, 80) ?? existing?.name ?? null });
  }
  return { invitees: [...invitees.values()], invalid };
}
