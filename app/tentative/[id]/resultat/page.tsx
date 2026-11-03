import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AttemptResultView } from "@/features/attempts/components/attempt-result-view";
import { AppError } from "@/lib/errors";
import { resolveOwner } from "@/lib/attempt-owner";
import { getAttemptResult } from "@/services/attempt-view.service";

export const metadata: Metadata = { title: "Résultats", robots: { index: false } };

export default async function ResultatPage({ params }: PageProps<"/tentative/[id]/resultat">) {
  const owner = await resolveOwner();
  const { id } = await params;
  if (!owner) notFound();

  let result: Awaited<ReturnType<typeof getAttemptResult>>;
  try {
    result = await getAttemptResult(id, owner);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  if (result.status === "IN_PROGRESS") redirect(`/tentative/${id}`);

  return (
    <>
      {result.guest && (
        <div className="mx-auto mb-6 flex max-w-3xl flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-medium">Conservez ce résultat.</span>{" "}
            <span className="text-muted-foreground">Créez un compte gratuit : vos séries faites sur ce navigateur y seront rattachées.</span>
          </p>
          <Button asChild size="sm">
            <Link href="/inscription">Créer mon compte</Link>
          </Button>
        </div>
      )}
      <AttemptResultView result={result} />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={result.guest ? "/" : "/espace"}>{result.guest ? "Accueil" : "Mon espace"}</Link>
        </Button>
        {result.access !== "none" && (
          <Button asChild variant="outline">
            <a href={`/tentative/${id}/resultat/pdf`}>Télécharger la synthèse (PDF)</a>
          </Button>
        )}
        {!result.campaignId && (
          <Button asChild>
            <Link href="/entrainement">Nouvel entraînement</Link>
          </Button>
        )}
      </div>
    </>
  );
}
