import "server-only";
import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";
import { currentGuestId } from "@/lib/guest-cookie";
import { claimGuestAttempts } from "@/services/attempt.service";
import { consumeLoginLink } from "@/services/email-login.service";
import { clientIpFrom, isLoginBlocked, recordLoginAttempt } from "@/services/rate-limit.service";

/** Délai entre deux revérifications du compte (rôle, activation) dans le JWT. */
const ACCOUNT_RECHECK_MS = 5 * 60 * 1000;

/** Hachage valide d'un mot de passe aléatoire jeté : ne correspond à rien. */
const DUMMY_HASH = "$2b$12$O13rNmRgXZXBXTVFfBzRnu0wpcH28/fMznD46oodg1zYcjKtCjpf6";

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class InvalidLinkError extends CredentialsSignin {
  code = "invalid_link";
}

/** Après toute connexion : date de connexion et rattachement des séries faites sans compte. */
async function afterSignIn(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  try {
    const guestId = await currentGuestId();
    if (guestId) await claimGuestAttempts(guestId, userId);
  } catch (error) {
    // Le rattachement ne doit jamais empêcher la connexion.
    console.error("[auth] rattachement des tentatives invitées", error);
  }
}

const toSessionUser = (user: { id: string; name: string; email: string; platformRole: "SUPER_ADMIN" | "USER" }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  platformRole: user.platformRole,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new InvalidCredentialsError();

        const { email, password } = parsed.data;
        const ip = clientIpFrom(request.headers);

        if (await isLoginBlocked(email, ip)) throw new RateLimitedError();

        const user = await prisma.user.findUnique({ where: { email } });
        // Comparaison exécutée même si l'utilisateur n'existe pas (temps constant).
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid || !user.isActive) {
          await recordLoginAttempt(email, ip, false);
          throw new InvalidCredentialsError();
        }

        await recordLoginAttempt(email, ip, true);
        await afterSignIn(user.id);
        return toSessionUser(user);
      },
    }),
    // Lien de connexion reçu par e-mail (connexion ou création de compte).
    Credentials({
      id: "email-link",
      credentials: { token: { type: "text" } },
      async authorize(credentials) {
        const token = typeof credentials?.token === "string" ? credentials.token : "";
        if (!/^[A-Za-z0-9_-]{30,60}$/.test(token)) throw new InvalidLinkError();
        const user = await consumeLoginLink(token);
        if (!user) throw new InvalidLinkError();
        await afterSignIn(user.id);
        return toSessionUser(user);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id && user.platformRole) {
        token.id = user.id;
        token.platformRole = user.platformRole;
        token.checkedAt = Date.now();
        return token;
      }
      // Revérification périodique : un compte désactivé ou rétrogradé perd ses droits.
      if (token.id && Date.now() - (token.checkedAt ?? 0) > ACCOUNT_RECHECK_MS) {
        const account = await prisma.user.findUnique({
          where: { id: token.id },
          select: { platformRole: true, isActive: true, name: true },
        });
        if (!account || !account.isActive) return null;
        token.platformRole = account.platformRole;
        token.name = account.name;
        token.checkedAt = Date.now();
      }
      return token;
    },
  },
});
