import type { Metadata } from "next";
import { requireOrgMember } from "@/lib/guards";
import { orgRoleLabels } from "@/lib/permissions";

export const metadata: Metadata = { title: "Espace organisation" };

const roadmap = [
  { title: "Passage des épreuves", text: "Chronométrage contrôlé par le serveur, reprise après coupure, soumission automatique." },
  { title: "Invitations", text: "Envoi des invitations aux candidats par e-mail et suivi des participations." },
  { title: "Résultats", text: "Scores par épreuve et par catégorie, correction manuelle, rapports." },
];

export default async function OrganisationPage({ params }: PageProps<"/organisation/[slug]">) {
  const { slug } = await params;
  const { organization, role } = await requireOrgMember(slug);

  return (
    <>
      <p className="text-sm font-medium text-muted-foreground">Espace organisation · {orgRoleLabels[role]}</p>
      <h1 className="mt-2 text-3xl font-semibold">{organization.name}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Banque de questions, évaluations et campagnes sont disponibles dans le menu. Le passage des épreuves, les
        invitations et les résultats sont en cours de développement et apparaîtront au fur et à mesure.
      </p>

      <section className="mt-10 rounded-xl border bg-card">
        <h2 className="border-b px-6 py-4 text-sm font-medium text-muted-foreground">Prochainement</h2>
        <ul className="divide-y">
          {roadmap.map((item) => (
            <li key={item.title} className="px-6 py-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
