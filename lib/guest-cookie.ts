import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Cookie d'un visiteur sans compte : jeton aléatoire httpOnly. Seul son
 * hachage (guestId) est stocké en base : une fuite ne permet pas d'usurper.
 */
const GUEST_COOKIE = "aptitude_invite";
const GUEST_MAX_AGE = 30 * 24 * 60 * 60;

const hashGuestToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Identifiant invité du navigateur courant, s'il existe. */
export async function currentGuestId(): Promise<string | null> {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  return token && /^[A-Za-z0-9_-]{30,60}$/.test(token) ? hashGuestToken(token) : null;
}

/** Pose un nouveau cookie invité (Server Actions et Route Handlers uniquement). */
export async function createGuestId(): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  (await cookies()).set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_MAX_AGE,
  });
  return hashGuestToken(token);
}
