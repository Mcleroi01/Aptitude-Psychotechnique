import type { OrgRole } from "@/generated/prisma/enums";

/**
 * Droits au sein d'une organisation. Vérifiés côté serveur dans chaque action
 * (lib/guards.ts) ; l'interface ne fait que masquer ce qui n'est pas permis.
 */
export const orgPermissions = {
  "organization:manage": ["OWNER"],
  "members:manage": ["OWNER", "ADMIN"],
  "questions:write": ["OWNER", "ADMIN", "RECRUITER"],
  "assessments:write": ["OWNER", "ADMIN", "RECRUITER"],
  "campaigns:write": ["OWNER", "ADMIN", "RECRUITER"],
  "results:read": ["OWNER", "ADMIN", "RECRUITER"],
  "answers:grade": ["OWNER", "ADMIN", "GRADER"],
} as const satisfies Record<string, readonly OrgRole[]>;

export type OrgPermission = keyof typeof orgPermissions;

export function can(role: OrgRole, permission: OrgPermission): boolean {
  return (orgPermissions[permission] as readonly OrgRole[]).includes(role);
}

export const orgRoleLabels: Record<OrgRole, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  RECRUITER: "Recruteur",
  GRADER: "Correcteur",
};
