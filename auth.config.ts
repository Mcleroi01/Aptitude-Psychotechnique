import type { NextAuthConfig } from "next-auth";

/**
 * Configuration partagée avec proxy.ts : aucune dépendance à la base ni à bcrypt.
 * Le proxy ne fait qu'une vérification optimiste ; l'autorisation réelle est
 * revérifiée côté serveur (lib/guards.ts) dans chaque page, action et route.
 */
export const authConfig = {
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const user = auth?.user;

      if (pathname === "/connexion" || pathname === "/inscription") {
        return user ? Response.redirect(new URL("/espace", request.nextUrl)) : true;
      }
      if (pathname.startsWith("/admin")) {
        if (!user) return false;
        return user.platformRole === "SUPER_ADMIN" ? true : Response.redirect(new URL("/espace", request.nextUrl));
      }
      // L'appartenance à l'organisation est vérifiée côté serveur (requireOrgMember).
      if (pathname.startsWith("/espace") || pathname.startsWith("/organisation") || pathname.startsWith("/tentative")) {
        return Boolean(user);
      }
      return true;
    },
    session({ session, token }) {
      if (token.id && token.platformRole) {
        session.user.id = token.id;
        session.user.platformRole = token.platformRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
