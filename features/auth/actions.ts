"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { AppError, runAction, type ActionResult } from "@/lib/errors";
import { assertUser } from "@/lib/guards";
import { safeCallbackUrl } from "@/lib/redirects";
import { companyRegisterSchema, createOrganizationSchema, loginSchema, registerSchema } from "@/schemas/auth";
import { sendVerificationEmail, verifyEmail } from "@/services/email-verification.service";
import { createOrganization } from "@/services/organization.service";
import { clientIpFrom, isRegistrationBlocked, recordRegistration } from "@/services/rate-limit.service";
import { createUser } from "@/services/user.service";

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

async function assertRegistrationAllowed() {
  const ip = clientIpFrom(await headers());
  if (await isRegistrationBlocked(ip)) {
    throw new AppError("RATE_LIMITED", "Trop d'inscriptions depuis cette connexion. Réessayez dans une heure.");
  }
  return ip;
}

/** L'échec d'envoi ne bloque pas l'inscription : le lien peut être renvoyé depuis l'espace. */
async function trySendVerificationEmail(userId: string) {
  try {
    await sendVerificationEmail(userId);
  } catch (error) {
    console.error("[verification-email]", error);
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
    const ip = await assertRegistrationAllowed();

    const user = await createUser(data);
    await recordRegistration(ip);
    await trySendVerificationEmail(user.id);
    await signInWithCredentials(data.email, data.password, "/espace");
  });
}

/** Inscription entreprise : compte + organisation dont il devient propriétaire. */
export async function registerCompanyAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const data = companyRegisterSchema.parse(input);
    const ip = await assertRegistrationAllowed();

    const user = await createUser(data);
    await recordRegistration(ip);
    const organization = await createOrganization(user.id, data.organizationName);
    await trySendVerificationEmail(user.id);
    await signInWithCredentials(data.email, data.password, `/organisation/${organization.slug}`);
  });
}

/** Utilisateur déjà connecté qui crée une organisation supplémentaire. */
export async function createOrganizationAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const user = await assertUser();
    const { organizationName } = createOrganizationSchema.parse(input);
    const organization = await createOrganization(user.id, organizationName);
    redirect(`/organisation/${organization.slug}`);
  });
}

export async function resendVerificationAction(): Promise<ActionResult> {
  return runAction(async () => {
    const user = await assertUser();
    await sendVerificationEmail(user.id);
  });
}

export async function verifyEmailAction(token: unknown): Promise<ActionResult> {
  return runAction(async () => {
    if (typeof token !== "string" || token.length < 20 || token.length > 200) {
      throw new AppError("VALIDATION", "Lien de vérification invalide.");
    }
    if (!(await verifyEmail(token))) {
      throw new AppError("VALIDATION", "Ce lien est invalide, déjà utilisé ou expiré. Demandez-en un nouveau.");
    }
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
