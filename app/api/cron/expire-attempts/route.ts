import { timingSafeEqual } from "node:crypto";
import { expireOverdueAttempts } from "@/services/attempt.service";

/**
 * Clôture des tentatives abandonnées (appelée par Vercel Cron, voir vercel.json).
 * Filet de sécurité : une tentative dépassée est de toute façon clôturée dès
 * qu'on la consulte. Vercel envoie « Authorization: Bearer <CRON_SECRET> ».
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const authorized =
    Boolean(secret) && header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  if (!authorized) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const expired = await expireOverdueAttempts();
  return Response.json({ expired });
}
