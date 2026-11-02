import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LocalDate } from "@/components/shared/local-date";
import { CreateCampaignForm } from "@/features/campaigns/components/create-campaign-form";
import { campaignAccessLabels, campaignStatusLabels } from "@/lib/assessments/labels";
import { requireOrgMember } from "@/lib/guards";
import { listAssessments } from "@/services/assessment.service";
import { listCampaigns } from "@/services/campaign.service";

export const metadata: Metadata = { title: "Campagnes" };

export default async function CampaignsPage({ params }: PageProps<"/organisation/[slug]/campagnes">) {
  const { slug } = await params;
  const { organization } = await requireOrgMember(slug, "campaigns:write");
  const [campaigns, own, platform] = await Promise.all([
    listCampaigns(organization.id),
    listAssessments({ organizationId: organization.id }),
    listAssessments({ organizationId: null }, { publishedOnly: true }),
  ]);
  const options = [
    ...own.map((a) => ({ id: a.id, title: a.title, platform: false, ready: a.status === "PUBLISHED" })),
    ...platform.map((a) => ({ id: a.id, title: a.title, platform: true, ready: true })),
  ];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Campagnes</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Une campagne fait passer une évaluation à des candidats, sur une période donnée, avec vos règles d&apos;accès
            et de communication des résultats.
          </p>
        </div>
        <CreateCampaignForm slug={organization.slug} assessments={options} />
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="font-medium">Aucune campagne pour le moment.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Campagne</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Accès</th>
                <th className="px-5 py-3 font-medium">Clôture</th>
                <th className="px-5 py-3 text-right font-medium">Tentatives</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3">
                    <Link href={`/organisation/${organization.slug}/campagnes/${c.id}`} className="font-medium hover:underline">
                      {c.title}
                    </Link>
                    <span className="block text-muted-foreground">{c.assessment.title}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={c.status === "PUBLISHED" ? "success" : "secondary"}>{campaignStatusLabels[c.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{campaignAccessLabels[c.accessMode].label}</td>
                  <td className="px-5 py-3 whitespace-nowrap tabular">
                    <LocalDate value={c.closesAt} />
                  </td>
                  <td className="px-5 py-3 text-right tabular">{c._count.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
