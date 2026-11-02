import "server-only";
import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";
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

        await Promise.all([
          recordLoginAttempt(email, ip, true),
          prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
        ]);

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id && user.role) {
        token.id = user.id;
        token.role = user.role;
        token.checkedAt = Date.now();
        return token;
      }
      // Revérification périodique : un compte désactivé ou rétrogradé perd ses droits.
      if (token.id && Date.now() - (token.checkedAt ?? 0) > ACCOUNT_RECHECK_MS) {
        const account = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, isActive: true, name: true },
        });
        if (!account || !account.isActive) return null;
        token.role = account.role;
        token.name = account.name;
        token.checkedAt = Date.now();
      }
      return token;
    },
  },
});
