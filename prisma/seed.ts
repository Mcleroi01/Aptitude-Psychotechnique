/**
 * Données initiales : catégories de la banque Aptitude, modèle d'évaluation
 * d'exemple et compte super-administrateur (si SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD sont définis). Idempotent : peut être relancé sans doublons.
 * Les questions de la banque Aptitude sont ajoutées en phase 4.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { categories } from "../lib/content/categories";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL ou DATABASE_URL doit être défini.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedCategories() {
  for (const [index, category] of categories.entries()) {
    // organizationId null = banque Aptitude. L'unicité (null, slug) n'étant pas
    // garantie par PostgreSQL, on recherche avant de créer.
    const existing = await prisma.category.findFirst({
      where: { organizationId: null, slug: category.slug },
      select: { id: true },
    });
    const data = { ...category, order: index, organizationId: null };
    if (existing) await prisma.category.update({ where: { id: existing.id }, data });
    else await prisma.category.create({ data });
  }
  console.log(`✔ ${categories.length} catégories (banque Aptitude)`);
}

/**
 * Exemple de configuration, pas une règle : 15 questions tirées au hasard en
 * 15 minutes. Tout est modifiable ou supprimable depuis l'administration.
 */
const EXAMPLE_ASSESSMENT_TITLE = "Examen blanc — exemple 15 questions en 15 minutes";

async function seedExampleAssessment() {
  const existing = await prisma.assessment.findFirst({
    where: { organizationId: null, title: EXAMPLE_ASSESSMENT_TITLE },
    select: { id: true },
  });
  if (existing) {
    console.log("• Évaluation d'exemple déjà présente");
    return;
  }
  await prisma.assessment.create({
    data: {
      title: EXAMPLE_ASSESSMENT_TITLE,
      description: "Questions de raisonnement numérique tirées dans toutes les catégories de la banque Aptitude.",
      timingMode: "GLOBAL",
      durationSeconds: 15 * 60,
      status: "DRAFT", // publiée en phase 4, une fois la banque de questions remplie
      sections: {
        create: {
          order: 0,
          title: "Raisonnement numérique",
          instructions: "Une seule bonne réponse par question. Calculatrice non autorisée.",
          selectionMode: "RANDOM",
          drawRules: [{ count: 15, points: 1 }],
        },
      },
    },
  });
  console.log("✔ Évaluation d'exemple (brouillon)");
}

async function seedSuperAdmin() {
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
    if (existing.platformRole !== "SUPER_ADMIN") {
      await prisma.user.update({ where: { email }, data: { platformRole: "SUPER_ADMIN" } });
    }
    console.log(`• Super-administrateur ${email} déjà présent`);
    return;
  }
  await prisma.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME?.trim() || "Administrateur",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      platformRole: "SUPER_ADMIN",
      // Adresse fournie par l'exploitant de la plateforme lui-même.
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✔ Super-administrateur ${email}`);
}

async function main() {
  await seedCategories();
  await seedExampleAssessment();
  await seedSuperAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
