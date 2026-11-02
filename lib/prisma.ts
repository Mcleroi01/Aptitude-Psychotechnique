import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

function createPrismaClient() {
  // Pool réduit : chaque instance serverless ouvre ses propres connexions,
  // le pooler Supabase (pgbouncer, port 6543) se charge du multiplexage.
  const adapter = new PrismaPg({ connectionString: getServerEnv().DATABASE_URL, max: 5 });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Instance unique (réutilisée entre les rechargements à chaud en développement). */
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}

/**
 * Client créé à la première requête et non à l'import : le build Next.js
 * (collecte des routes) n'exige donc pas les variables de connexion.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
