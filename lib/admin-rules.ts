import type { PlatformRole } from "@/generated/prisma/enums";

export type AccountChange = { kind: "deactivate" } | { kind: "activate" } | { kind: "role"; role: PlatformRole };

/**
 * Garde-fous des actions d'administration : un administrateur ne peut ni se
 * désactiver ni se rétrograder, et la plateforme garde toujours au moins un
 * super-administrateur actif. Renvoie le motif du refus, ou null.
 */
export function accountChangeRefusal(input: {
  actorId: string;
  target: { id: string; platformRole: PlatformRole; isActive: boolean };
  activeSuperAdmins: number;
  change: AccountChange;
}): string | null {
  const { actorId, target, activeSuperAdmins, change } = input;
  const removesAdmin =
    target.platformRole === "SUPER_ADMIN" &&
    target.isActive &&
    (change.kind === "deactivate" || (change.kind === "role" && change.role !== "SUPER_ADMIN"));

  if (target.id === actorId && (change.kind === "deactivate" || removesAdmin)) {
    return "Vous ne pouvez pas désactiver ni rétrograder votre propre compte.";
  }
  if (removesAdmin && activeSuperAdmins <= 1) {
    return "La plateforme doit conserver au moins un super-administrateur actif.";
  }
  return null;
}
