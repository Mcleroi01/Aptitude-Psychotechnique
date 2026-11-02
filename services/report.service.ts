import "server-only";
import { formatDuration, formatPoints } from "@/lib/assessments/labels";
import { PdfReport } from "@/lib/pdf/report";
import { toCsv } from "@/lib/results/csv";
import { percentOf } from "@/lib/results/stats";
import type { AttemptResult } from "@/services/attempt-view.service";
import type { CampaignResults } from "@/services/results.service";

const statusText = { IN_PROGRESS: "En cours", PENDING_REVIEW: "En correction", COMPLETED: "Terminée" } as const;
const pct = (n: number | null) => (n === null ? "—" : `${String(n).replace(".", ",")} %`);
const yesNo = (b: boolean | null) => (b === null ? "—" : b ? "Oui" : "Non");
const dateTime = (d: Date | null) =>
  d ? d.toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" }) + " UTC" : "—";

/** Une ligne par tentative, avec le pourcentage obtenu à chaque épreuve. */
export function campaignResultsCsv({ campaign, attempts }: CampaignResults): string {
  const sections = campaign.assessment.sections;
  const header = [
    "Candidat",
    "E-mail",
    "Statut",
    "Score",
    "Score maximal",
    "Pourcentage",
    "Réussite",
    "Temps (secondes)",
    "Début (UTC)",
    "Soumission (UTC)",
    ...sections.map((s) => `${s.title} (%)`),
  ];
  const rows = attempts.map((a) => [
    a.user.name,
    a.user.email,
    statusText[a.status],
    a.score,
    a.maxScore,
    a.percent,
    a.passed,
    a.timeSpentSeconds,
    a.startedAt,
    a.submittedAt,
    ...sections.map((section) => {
      const s = a.sections.find((x) => x.sectionId === section.id);
      return s && s.maxScore ? percentOf(s.score ?? 0, s.maxScore) : null;
    }),
  ]);
  return toCsv(header, rows);
}

export async function campaignResultsPdf({ campaign, attempts, stats }: CampaignResults, organizationName: string) {
  const report = await PdfReport.create(`Résultats - ${campaign.title}`);
  report.title(campaign.title, `${organizationName} · ${campaign.assessment.title}`);
  report.facts([
    ["Participants", String(stats.participants)],
    ["Tentatives terminées", String(stats.finished)],
    ["Score moyen", pct(stats.average)],
    ["Score médian", pct(stats.median)],
    ["Taux de réussite", pct(stats.passRate)],
    ["En attente de correction", String(stats.pendingReview)],
  ]);

  if (stats.sections.length > 0) {
    report.heading("Par épreuve");
    report.table(
      [
        { header: "Épreuve", width: 5 },
        { header: "Score moyen", width: 2, align: "right" },
        { header: "Temps moyen", width: 2, align: "right" },
      ],
      stats.sections.map((s) => [s.title, pct(s.average), s.averageTime !== null ? formatDuration(s.averageTime) : "—"]),
    );
  }
  if (stats.categories.length > 0) {
    report.heading("Par catégorie");
    report.table(
      [
        { header: "Catégorie", width: 5 },
        { header: "Réponses justes", width: 2, align: "right" },
        { header: "Réussite", width: 2, align: "right" },
      ],
      stats.categories.map((c) => [c.name, `${c.correct} / ${c.total}`, pct(c.percent)]),
    );
  }

  report.heading("Tentatives");
  report.table(
    [
      { header: "Candidat", width: 4 },
      { header: "Statut", width: 2 },
      { header: "Score", width: 2, align: "right" },
      { header: "Réussite", width: 1.4 },
      { header: "Temps", width: 1.6, align: "right" },
    ],
    attempts.map((a) => [a.user.name, statusText[a.status], pct(a.percent), yesNo(a.passed), formatDuration(a.timeSpentSeconds)]),
  );
  report.paragraph("Données personnelles : à conserver et partager uniquement dans le cadre du recrutement concerné.", { size: 8 });
  return report.toBytes();
}

/** Synthèse d'une tentative (sans le détail des questions). */
export async function attemptResultPdf(result: AttemptResult, candidate?: { name: string; email: string }) {
  const report = await PdfReport.create(`Résultats - ${result.title}`);
  report.title(result.title, candidate ? `${candidate.name} · ${candidate.email}` : undefined);
  const summary = result.summary;
  if (!summary) {
    report.paragraph("Participation enregistrée. Les résultats ne sont pas communiqués.");
    return report.toBytes();
  }
  report.facts([
    ["Score", `${pct(summary.percent)} (${formatPoints(summary.score)} / ${formatPoints(summary.maxScore)})`],
    ["Réponses justes", `${summary.correct} / ${summary.total}`],
    ["Temps utilisé", formatDuration(result.timeSpentSeconds)],
    ["Réussite", yesNo(summary.passed)],
    ["Début", dateTime(result.startedAt)],
    ["Soumission", dateTime(result.submittedAt)],
  ]);
  if (result.status === "PENDING_REVIEW") report.paragraph("Certaines réponses attendent une correction manuelle : le score est provisoire.");

  if (result.sections.length > 0) {
    report.heading("Par épreuve");
    report.table(
      [
        { header: "Épreuve", width: 5 },
        { header: "Score", width: 2.5, align: "right" },
        { header: "Pourcentage", width: 2, align: "right" },
        { header: "Temps", width: 2, align: "right" },
      ],
      result.sections.map((s) => [
        s.title,
        `${formatPoints(s.score)} / ${formatPoints(s.maxScore)}`,
        pct(percentOf(s.score, s.maxScore)),
        formatDuration(s.timeSpentSeconds),
      ]),
    );
  }
  if (result.categories.length > 0) {
    report.heading("Par catégorie");
    report.table(
      [
        { header: "Catégorie", width: 5 },
        { header: "Réponses justes", width: 2.5, align: "right" },
        { header: "Pourcentage", width: 2, align: "right" },
      ],
      result.categories.map((c) => [c.name, `${c.correct} / ${c.total}`, pct(percentOf(c.score, c.maxScore))]),
    );
  }
  return report.toBytes();
}
