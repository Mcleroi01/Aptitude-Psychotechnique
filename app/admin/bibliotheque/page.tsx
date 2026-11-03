import type { Metadata } from "next";
import { LibraryManager } from "@/features/library/components/library-manager";
import { requireSuperAdmin } from "@/lib/guards";
import { listAllDocuments } from "@/services/document.service";

export const metadata: Metadata = { title: "Bibliothèque" };

export default async function AdminLibraryPage() {
  await requireSuperAdmin();
  const documents = await listAllDocuments();
  return (
    <>
      <h1 className="text-3xl font-semibold">Bibliothèque</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Chaque document affiche sa source et son statut de vérification. Ne publiez jamais un document non vérifié comme un
        communiqué officiel, ni un document contenant des données personnelles (listes nominatives, etc.).
      </p>
      <div className="mt-8">
        <LibraryManager
          documents={documents.map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            category: d.category,
            source: d.source,
            documentDate: d.documentDate ? d.documentDate.toISOString().slice(0, 10) : null,
            verificationStatus: d.verificationStatus,
            requiresAuth: d.requiresAuth,
            isPublished: d.isPublished,
            fileType: d.fileType,
            fileSize: d.fileSize,
          }))}
        />
      </div>
    </>
  );
}
