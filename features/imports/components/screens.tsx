import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocalDate } from "@/components/shared/local-date";
import { ImportReview } from "@/features/imports/components/import-review";
import { ImportUploader } from "@/features/imports/components/import-uploader";
import { bankPaths, type BankRef } from "@/features/questions/bank";
import { AppError } from "@/lib/errors";
import { listCategories } from "@/services/category.service";
import { getImportJob, listImportJobs } from "@/services/import.service";
import type { BankScope } from "@/services/question.service";
import { signedReadUrl } from "@/services/storage.service";

const statusLabels = { UPLOADED: "Envoyé", IN_REVIEW: "En vérification", COMMITTED: "Terminé", FAILED: "Échec", CANCELLED: "Abandonné" } as const;
const sourceLabels = { CSV: "CSV", XLSX: "Excel", PDF: "PDF", IMAGE: "Image" } as const;

export async function ImportListScreen({ bank, scope }: { bank: BankRef; scope: BankScope }) {
  const paths = bankPaths(bank);
  const jobs = await listImportJobs(scope);

  return (
    <>
      <h1 className="text-3xl font-semibold">Importer des questions</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Depuis un tableur (CSV, Excel) ou un document (PDF, image). Chaque question est vérifiée et validée par vous avant
        d&apos;entrer dans la banque.
      </p>
      <div className="mt-8">
        <ImportUploader bank={bank} templateHref="/api/import/modele" />
      </div>

      <h2 className="mt-12 font-heading text-lg font-semibold">Imports récents</h2>
      {jobs.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Aucun import pour le moment.</p>
      ) : (
        <ul className="mt-4 divide-y rounded-2xl border bg-card">
          {jobs.map((job) => {
            const Icon = job.source === "CSV" || job.source === "XLSX" ? FileSpreadsheet : FileText;
            const imported = job.items.filter((i) => i.questionId).length;
            return (
              <li key={job.id}>
                <Link href={paths.importJob(job.id)} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-muted/40">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{job.fileName}</span>
                    <span className="block text-sm text-muted-foreground">
                      {sourceLabels[job.source]} · {job._count.items} ligne(s) · {imported} importée(s) · <LocalDate value={job.createdAt} />
                    </span>
                  </span>
                  <Badge variant={job.status === "COMMITTED" ? "success" : "secondary"}>{statusLabels[job.status]}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export async function ImportJobScreen({ bank, scope, jobId }: { bank: BankRef; scope: BankScope; jobId: string }) {
  let job: Awaited<ReturnType<typeof getImportJob>>;
  try {
    job = await getImportJob(scope, jobId);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const [categories, documentUrl] = await Promise.all([listCategories(scope), signedReadUrl("attachment", job.storagePath)]);

  return (
    <>
      <Link href={bankPaths(bank).imports} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Imports
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{job.fileName}</h1>
        <Badge variant="secondary">{sourceLabels[job.source]}</Badge>
        <Badge variant={job.status === "COMMITTED" ? "success" : "secondary"}>{statusLabels[job.status]}</Badge>
      </div>
      <ImportReview
        bank={bank}
        categories={categories.map(({ id, name }) => ({ id, name }))}
        job={{
          id: job.id,
          status: job.status,
          source: job.source,
          fileName: job.fileName,
          documentUrl,
          items: job.items.map((i) => ({
            id: i.id,
            rowNumber: i.rowNumber,
            status: i.status,
            errors: i.errors,
            questionId: i.questionId,
            values: i.values,
          })),
        }}
      />
    </>
  );
}
