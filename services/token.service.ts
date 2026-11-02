import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { TokenPurpose } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Crée un jeton à usage unique ; seul son hachage est conservé en base. */
export async function issueToken(userId: string, purpose: TokenPurpose, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    // Un nouveau jeton invalide les précédents de même usage.
    prisma.verificationToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
    prisma.verificationToken.create({
      data: { userId, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) },
    }),
  ]);
  return token;
}

/** Consomme un jeton valide et renvoie l'utilisateur associé, ou null. */
export async function consumeToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.purpose !== purpose || record.usedAt || record.expiresAt < new Date()) return null;
  // Mise à jour conditionnelle : un jeton n'est consommé qu'une fois, même en parallèle.
  const { count } = await prisma.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return count === 1 ? record.userId : null;
}
