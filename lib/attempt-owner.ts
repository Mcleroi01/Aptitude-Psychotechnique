import "server-only";
import { getSessionUser } from "@/lib/guards";
import { createGuestId, currentGuestId } from "@/lib/guest-cookie";

/** Propriétaire d'une tentative : un compte, ou un visiteur sans compte. */
export type AttemptOwner = { userId: string; guestId?: undefined } | { guestId: string; userId?: undefined };

export function ownerWhere(owner: AttemptOwner) {
  return owner.userId ? { userId: owner.userId } : { guestId: owner.guestId };
}

/**
 * Propriétaire courant. `create` (Server Actions uniquement : on ne peut poser
 * de cookie que là) attribue un identifiant invité au visiteur qui n'en a pas.
 */
export async function resolveOwner(options: { create?: boolean } = {}): Promise<AttemptOwner | null> {
  const user = await getSessionUser();
  if (user) return { userId: user.id };
  const guestId = await currentGuestId();
  if (guestId) return { guestId };
  return options.create ? { guestId: await createGuestId() } : null;
}
