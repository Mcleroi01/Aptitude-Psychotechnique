import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Download, FileText, Image as ImageIcon, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero, Section, SectionHeading } from "@/components/shared/section";
import { getSessionUser } from "@/lib/guards";
import { DOCUMENT_CATEGORIES, documentCategoryLabels, verificationLabels } from "@/lib/library";
import { cn } from "@/lib/utils";
import { listPublishedDocuments } from "@/services/document.service";
import type { DocumentCategory } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Bibliothèque documentaire",
  description: "Questionnaires, notions de mathématiques, ressources de préparation et communiqués, avec source et statut de vérification.",
};

async function loadDocuments(category?: DocumentCategory) {
  try {
    return await listPublishedDocuments({ category });
  } catch (error) {
    console.error("[bibliothèque]", error);
    return null;
  }
}

export default async function BibliothequePage({ searchParams }: PageProps<"/bibliotheque">) {
  const { categorie } = await searchParams;
  const category = DOCUMENT_CATEGORIES.find((c) => c === categorie);
  const [documents, user] = await Promise.all([loadDocuments(category), getSessionUser()]);

  return (
    <>
      <PageHero
        eyebrow="Bibliothèque"
        title="Des ressources fiables, à la source identifiée"
        description="Chaque document affiche sa catégorie, sa date, sa source et son statut de vérification. Les fichiers sont servis par des liens sécurisés et temporaires."
      />

      <Section>
        <nav aria-label="Catégories" data-reveal className="flex flex-wrap gap-2">
          <FilterChip href="/bibliotheque" active={!category}>
            Tout
          </FilterChip>
          {DOCUMENT_CATEGORIES.map((c) => (
            <FilterChip key={c} href={`/bibliotheque?categorie=${c}`} active={category === c}>
              {documentCategoryLabels[c]}
            </FilterChip>
          ))}
        </nav>

        {documents === null ? (
          <p className="mt-10 rounded-xl border bg-card px-6 py-10 text-center text-muted-foreground">
            La bibliothèque est momentanément indisponible.
          </p>
        ) : documents.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed bg-card px-6 py-10 text-center text-muted-foreground">
            Aucun document publié {category ? "dans cette catégorie " : ""}pour le moment.
          </p>
        ) : (
          <ul data-stagger className="mt-10 grid gap-4 md:grid-cols-2">
            {documents.map((doc) => {
              const status = verificationLabels[doc.verificationStatus];
              const locked = doc.requiresAuth && !user;
              const Icon = doc.fileType === "application/pdf" ? FileText : ImageIcon;
              return (
                <li key={doc.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="size-5 text-primary" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-heading font-semibold">{doc.title}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {documentCategoryLabels[doc.category]}
                        {doc.documentDate && ` · ${doc.documentDate.toLocaleDateString("fr-FR", { timeZone: "UTC" })}`}
                      </p>
                    </div>
                  </div>
                  {doc.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{doc.description}</p>}
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Source : </span>
                    {doc.source}
                  </p>
                  <div className="mt-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  {doc.verificationStatus === "UNVERIFIED" && (
                    <p className="mt-3 flex gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs leading-relaxed">
                      <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                      {status.hint} Référez-vous au site de l&apos;organisme émetteur pour toute information officielle.
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs text-muted-foreground tabular">
                      {(doc.fileSize / 1024 / 1024).toFixed(1).replace(".", ",")} Mo
                    </span>
                    {locked ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/connexion?callbackUrl=${encodeURIComponent("/bibliotheque")}`}>
                          <Lock data-icon="inline-start" /> Se connecter pour télécharger
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <a href={`/bibliotheque/${doc.id}/telecharger`}>
                          <Download data-icon="inline-start" /> Télécharger
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section className="border-t bg-secondary/50">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading
            title="Vous savez toujours d'où vient un document"
            description="Un document non vérifié n'est jamais présenté comme un communiqué officiel. Pour toute information officielle, référez-vous au site de l'organisme émetteur."
          />
          <dl data-stagger className="divide-y border-y">
            {(["OFFICIAL_VERIFIED", "UNVERIFIED", "PLATFORM_CONTENT"] as const).map((key) => (
              <div key={key} className="py-5">
                <dt className="font-medium">
                  <Badge variant={verificationLabels[key].variant}>{verificationLabels[key].label}</Badge>
                </dt>
                <dd className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{verificationLabels[key].hint}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
