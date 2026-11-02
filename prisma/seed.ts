/**
 * Données initiales : catégories, configuration d'examen par défaut et compte
 * administrateur (si SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD sont définis).
 * Idempotent : peut être relancé sans créer de doublons.
 * La banque de questions sera ajoutée en phase 5 (prisma/seed-data/).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { categories } from "./seed-data/categories";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL ou DATABASE_URL doit être défini.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedCategories() {
  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { ...category, order: index },
      create: { ...category, order: index },
    });
  }
  console.log(`✔ ${categories.length} catégories`);
}

async function seedDefaultExam() {
  const existing = await prisma.examConfiguration.findFirst({ where: { isDefault: true } });
  if (existing) {
    console.log("• Configuration d'examen par défaut déjà présente");
    return;
  }
  await prisma.examConfiguration.create({
    data: {
      title: "Examen blanc standard",
      description: "15 questions en 15 minutes, toutes catégories et tous niveaux confondus.",
      questionCount: 15,
      durationSeconds: 900,
      categoryConfiguration: [],
      isActive: true,
      isDefault: true,
    },
  });
  console.log("✔ Configuration d'examen par défaut (15 questions / 15 min)");
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD absents : aucun administrateur créé");
    return;
  }
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD doit contenir au moins 12 caractères.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Ne modifie jamais le mot de passe d'un compte existant.
    if (existing.role !== "ADMIN") await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`• Administrateur ${email} déjà présent`);
    return;
  }
  await prisma.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME?.trim() || "Administrateur",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });
  console.log(`✔ Administrateur ${email}`);
}

async function main() {
  await seedCategories();
  await seedDefaultExam();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
