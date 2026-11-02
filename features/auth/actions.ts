"use server";

import { headers } from "next/headers";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { AppError, runAction, type ActionResult } from "@/lib/errors";
import { safeCallbackUrl } from "@/lib/redirects";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { clientIpFrom, isRegistrationBlocked, recordRegistration } from "@/services/rate-limit.service";
import { createCandidate } from "@/services/user.service";

function toAuthAppError(error: unknown): AppError | undefined {
  if (error instanceof CredentialsSignin) {
    if (error.code === "rate_limited") {
      return new AppError(
        "RATE_LIMITED",
        "Trop de tentatives de connexion. Patientez 15 minutes avant de réessayer.",
      );
    }
    return new AppError("UNAUTHORIZED", "Adresse e-mail ou mot de passe incorrect.");
  }
  if (error instanceof AuthError) {
    console.error("[auth]", error);
    return new AppError("INTERNAL", "La connexion est momentanément indisponible. Réessayez dans un instant.");
  }
  return undefined;
}

async function signInWithCredentials(email: string, password: string, callbackUrl: string) {
  try {
    // En cas de succès, signIn lève une redirection (relancée par runAction).
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    throw toAuthAppError(error) ?? error;
  }
}

export async function loginAction(input: unknown, callbackUrl?: string): Promise<ActionResult> {
  return runAction(async () => {
    const { email, password } = loginSchema.parse(input);
    await signInWithCredentials(email, password, safeCallbackUrl(callbackUrl));
  });
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const data = registerSchema.parse(input);
    const ip = clientIpFrom(await headers());

    if (await isRegistrationBlocked(ip)) {
      throw new AppError("RATE_LIMITED", "Trop d'inscriptions depuis cette connexion. Réessayez dans une heure.");
    }

    await createCandidate(data);
    await recordRegistration(ip);
    await signInWithCredentials(data.email, data.password, "/espace");
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
