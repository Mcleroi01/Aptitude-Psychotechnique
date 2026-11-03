import "server-only";
import type { DocumentCategory } from "@/generated/prisma/enums";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { DocumentInput } from "@/lib/library";
import { assertOwnedPath, bankStoragePrefix, removeFiles, signedReadUrl } from "@/services/storage.service";

/**
 * Bibliothèque de la plateforme. Les fichiers restent dans le bucket privé ;
 * un téléchargement passe par une URL signée valable quelques minutes.
 */

const LIBRARY_PREFIX = bankStoragePrefix(null);
const DOWNLOAD_TTL_SECONDS = 5 * 60;

export async function listPublishedDocuments(options: { category?: DocumentCategory }) {
  return prisma.document.findMany({
    where: { organizationId: null, isPublished: true, ...(options.category && { category: options.category }) },
    orderBy: [{ documentDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      fileType: true,
      fileSize: true,
      source: true,
      documentDate: true,
      verificationStatus: true,
      requiresAuth: true,
    },
  });
}

export async function listAllDocuments() {
  return prisma.document.findMany({ where: { organizationId: null }, orderBy: { createdAt: "desc" } });
}

export async function createDocument(
  userId: string,
  input: DocumentInput & { storagePath: string; fileType: string; fileSize: number },
) {
  assertOwnedPath(LIBRARY_PREFIX, input.storagePath, "library");
  return prisma.document.create({
    data: {
      ...input,
      description: input.description,
      documentDate: input.documentDate ? new Date(input.documentDate) : null,
      organizationId: null,
      uploadedById: userId,
    },
    select: { id: true },
  });
}

export async function updateDocument(id: string, input: DocumentInput) {
  const existing = await prisma.document.findFirst({ where: { id, organizationId: null }, select: { id: true } });
  if (!existing) throw new AppError("NOT_FOUND", "Document introuvable.");
  await prisma.document.update({
    where: { id },
    data: { ...input, documentDate: input.documentDate ? new Date(input.documentDate) : null },
  });
}

export async function deleteDocument(id: string) {
  const document = await prisma.document.findFirst({ where: { id, organizationId: null }, select: { storagePath: true } });
  if (!document) throw new AppError("NOT_FOUND", "Document introuvable.");
  await prisma.document.delete({ where: { id } });
  await removeFiles("attachment", [document.storagePath]);
}

/** URL de téléchargement : document publié, et compte requis si le document l'exige. */
export async function documentDownloadUrl(id: string, signedIn: boolean) {
  const document = await prisma.document.findFirst({
    where: { id, organizationId: null, isPublished: true },
    select: { title: true, storagePath: true, fileType: true, requiresAuth: true },
  });
  if (!document) throw new AppError("NOT_FOUND", "Document introuvable.");
  if (document.requiresAuth && !signedIn) throw new AppError("UNAUTHORIZED", "Connectez-vous pour télécharger ce document.");
  const extension = document.fileType === "application/pdf" ? "pdf" : document.fileType.split("/")[1];
  const url = await signedReadUrl("attachment", document.storagePath, {
    ttlSeconds: DOWNLOAD_TTL_SECONDS,
    downloadName: `${slugify(document.title, 60)}.${extension}`,
  });
  if (!url) throw new AppError("INTERNAL", "Téléchargement momentanément indisponible.");
  return url;
}
