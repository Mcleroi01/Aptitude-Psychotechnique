-- Catégorie documentaire neutre (aucun employeur nommé) : renommage sans perte de données.
ALTER TYPE "DocumentCategory" RENAME VALUE 'INFO_BCC' TO 'INFO_RECRUTEMENT';

-- Comptes créés par lien de connexion e-mail : pas de mot de passe.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Tentatives sans compte (entraînement et examens blancs).
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EmailLoginToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLoginToken_tokenHash_key" ON "EmailLoginToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailLoginToken_email_createdAt_idx" ON "EmailLoginToken"("email", "createdAt");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_guestId_status_idx" ON "AssessmentAttempt"("guestId", "status");
