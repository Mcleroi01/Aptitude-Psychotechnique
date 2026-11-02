import type { OrgRole, PlatformRole } from "@/generated/prisma/enums";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  platformRole: PlatformRole;
};

export type OrgContext = {
  user: SessionUser;
  organization: { id: string; name: string; slug: string };
  role: OrgRole;
};
