import "server-only";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;
const RETENTION_MS = 24 * 60 * 60 * 1000;

export function emailKey(email: string) {
  return `email:${email}`;
}

export function ipKey(ip: string) {
  return `ip:${ip}`;
}

/** Adresse IP du client derrière le proxy Vercel. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

/**
 * Indique si les échecs récents dépassent le seuil (fenêtre glissante de 15 min).
 * Stocké en base : compatible avec l'exécution serverless, sans Redis.
 */
export async function isLoginBlocked(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { key: emailKey(email), success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { key: ipKey(ip), success: false, createdAt: { gte: since } } }),
  ]);
  return byEmail >= MAX_FAILURES_PER_EMAIL || byIp >= MAX_FAILURES_PER_IP;
}

const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;
const MAX_REGISTRATIONS_PER_IP = 5;

function registrationKey(ip: string) {
  return `register:${ip}`;
}

/** Limite les créations de comptes à 5 par heure et par adresse IP. */
export async function isRegistrationBlocked(ip: string): Promise<boolean> {
  const count = await prisma.loginAttempt.count({
    where: { key: registrationKey(ip), createdAt: { gte: new Date(Date.now() - REGISTRATION_WINDOW_MS) } },
  });
  return count >= MAX_REGISTRATIONS_PER_IP;
}

export async function recordRegistration(ip: string) {
  await prisma.loginAttempt.create({ data: { key: registrationKey(ip), success: true } });
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  if (success) {
    // Une connexion réussie remet le compteur de l'adresse e-mail à zéro.
    await prisma.loginAttempt.deleteMany({ where: { key: emailKey(email), success: false } });
    return;
  }
  await prisma.loginAttempt.createMany({
    data: [
      { key: emailKey(email), success: false },
      { key: ipKey(ip), success: false },
    ],
  });
  // Nettoyage opportuniste des entrées anciennes (≈ 1 échec sur 20).
  if (Math.random() < 0.05) {
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
    });
  }
}
