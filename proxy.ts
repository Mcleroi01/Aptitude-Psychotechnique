import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Redirections optimistes selon la session (voir authConfig.callbacks.authorized).
export default auth;

export const config = {
  matcher: ["/espace/:path*", "/admin/:path*", "/connexion", "/inscription"],
};
