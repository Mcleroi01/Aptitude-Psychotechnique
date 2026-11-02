import "dotenv/config";
import { defineConfig } from "prisma/config";

// La CLI (migrations, seed) utilise la connexion DIRECTE (port 5432).
// L'application utilise DATABASE_URL (pooler pgbouncer, port 6543) via lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
