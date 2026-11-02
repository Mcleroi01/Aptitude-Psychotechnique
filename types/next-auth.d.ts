import type { DefaultSession } from "next-auth";
import "@auth/core/jwt";
import type { PlatformRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: { id: string; platformRole: PlatformRole } & DefaultSession["user"];
  }
  interface User {
    platformRole?: PlatformRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    platformRole?: PlatformRole;
    checkedAt?: number;
  }
}
