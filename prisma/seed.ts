/**
 * Données initiales : catégories de la banque Aptitude, modèle d'évaluation
 * d'exemple et compte super-administrateur (si SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD sont définis). Idempotent : peut être relancé sans doublons.
 * Les questions de la banque Aptitude sont des contenus originaux (seed-data/questions.ts).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { categories } from "../lib/content/categories";
import { seedQuestions, toSeedQuestionData } from "./seed-data/questions";

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

/** Ajoute les questions absentes ; une question déjà présente (même énoncé) n'est jamais écrasée. */
async function seedQuestionBank() {
  const categoryIds = new Map(
    (await prisma.category.findMany({ where: { organizationId: null }, select: { id: true, slug: true } })).map((c) => [
      c.slug,
      c.id,
    ]),
  );
  let created = 0;
  for (const question of seedQuestions) {
    const exists = await prisma.question.findFirst({
      where: { organizationId: null, prompt: question.prompt },
      select: { id: true },
    });
    if (exists) continue;
    const { options, answerKey, ...data } = toSeedQuestionData(question);
    await prisma.question.create({
      data: {
        ...data,
        answerKey,
        organizationId: null,
        categoryId: categoryIds.get(question.category) ?? null,
        status: "PUBLISHED",
        options: { create: options },
      },
    });
    created++;
  }
  console.log(`✔ Banque Aptitude : ${created} question(s) ajoutée(s), ${seedQuestions.length - created} déjà présente(s)`);
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
  // Publiable seulement si la banque contient assez de questions pour le tirage.
  const available = await prisma.question.count({ where: { organizationId: null, status: "PUBLISHED", isLatest: true } });
  await prisma.assessment.create({
    data: {
      title: EXAMPLE_ASSESSMENT_TITLE,
      description: "Questions de raisonnement numérique tirées dans toutes les catégories de la banque Aptitude.",
      timingMode: "GLOBAL",
      durationSeconds: 15 * 60,
      status: available >= 15 ? "PUBLISHED" : "DRAFT",
      sections: {
        create: {
          order: 0,
          title: "Raisonnement numérique",
          instructions: "Une seule bonne réponse par question. Calculatrice non autorisée.",
          selectionMode: "RANDOM",
          drawRules: [{ categoryId: null, difficulty: null, count: 15, points: 1 }],
        },
      },
    },
  });
  console.log(`✔ Évaluation d'exemple (${available >= 15 ? "publiée" : "brouillon : banque insuffisante"})`);
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD absents : aucun administrateur créé");
    return;
  }
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  // Les valeurs de .env.example sont publiques (dépôt git) : jamais pour un vrai compte.
  if (email.endsWith("@exemple.cd") || password === "changer-ce-mot-de-passe") {
    throw new Error("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD ont encore leur valeur d'exemple : renseignez votre adresse et un mot de passe personnel.");
  }

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
  await seedQuestionBank();
  await seedExampleAssessment();
  await seedSuperAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
