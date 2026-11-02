import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AttemptResultView } from "@/features/attempts/components/attempt-result-view";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/guards";
import { getAttemptResult } from "@/services/attempt-view.service";

export const metadata: Metadata = { title: "Résultats", robots: { index: false } };

export default async function ResultatPage({ params }: PageProps<"/tentative/[id]/resultat">) {
  const user = await requireUser();
  const { id } = await params;

  let result: Awaited<ReturnType<typeof getAttemptResult>>;
  try {
    result = await getAttemptResult(id, user.id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  if (result.status === "IN_PROGRESS") redirect(`/tentative/${id}`);

  return (
    <>
      <AttemptResultView result={result} />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/espace">Mon espace</Link>
        </Button>
        {!result.campaignId && (
          <Button asChild>
            <Link href="/espace/entrainement">Nouvel entraînement</Link>
          </Button>
        )}
      </div>
    </>
  );
}
