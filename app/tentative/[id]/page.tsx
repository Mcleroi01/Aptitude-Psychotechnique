import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttemptPlayer } from "@/features/attempts/components/attempt-player";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/guards";
import { getAttemptView } from "@/services/attempt-view.service";

export const metadata: Metadata = { title: "Épreuve en cours", robots: { index: false } };

export default async function TentativePage({ params }: PageProps<"/tentative/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  let view: Awaited<ReturnType<typeof getAttemptView>>;
  try {
    // Les échéances dépassées sont appliquées ici : une reprise tardive mène aux résultats.
    view = await getAttemptView(id, user.id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  if (view.status !== "IN_PROGRESS") redirect(`/tentative/${id}/resultat`);

  return <AttemptPlayer initial={view} />;
}
