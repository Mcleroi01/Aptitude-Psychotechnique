import { redirect } from "next/navigation";

/** L'entraînement est public : une seule page, avec ou sans compte. */
export default function EspaceEntrainementPage() {
  redirect("/entrainement");
}
