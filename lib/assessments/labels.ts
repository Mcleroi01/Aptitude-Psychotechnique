import type {
  CampaignAccess,
  CampaignStatus,
  NavigationMode,
  ResultsVisibility,
  SelectionMode,
  TimingMode,
} from "@/generated/prisma/enums";

export const TIMING_MODES = ["NONE", "GLOBAL", "PER_SECTION"] as const satisfies readonly TimingMode[];
export const NAVIGATION_MODES = ["FREE", "FORWARD_ONLY"] as const satisfies readonly NavigationMode[];
export const SELECTION_MODES = ["FIXED", "RANDOM"] as const satisfies readonly SelectionMode[];
export const CAMPAIGN_ACCESS = ["INVITE_ONLY", "LINK"] as const satisfies readonly CampaignAccess[];
export const RESULTS_VISIBILITY = [
  "HIDDEN",
  "SCORE_ONLY",
  "FULL_AFTER_SUBMIT",
  "FULL_AFTER_CLOSE",
] as const satisfies readonly ResultsVisibility[];

export const timingModeLabels: Record<TimingMode, { label: string; hint: string }> = {
  NONE: { label: "Sans limite", hint: "Le candidat prend le temps nécessaire." },
  GLOBAL: { label: "Durée globale", hint: "Une seule durée pour l'ensemble des épreuves." },
  PER_SECTION: { label: "Durée par épreuve", hint: "Chaque épreuve a son propre chronomètre." },
};

export const navigationModeLabels: Record<NavigationMode, string> = {
  FREE: "Navigation libre (retour possible)",
  FORWARD_ONLY: "Sans retour en arrière",
};

export const selectionModeLabels: Record<SelectionMode, { label: string; hint: string }> = {
  FIXED: { label: "Questions choisies", hint: "Les mêmes questions pour tous les candidats." },
  RANDOM: { label: "Tirage aléatoire", hint: "Des questions tirées au hasard selon vos règles, différentes pour chaque candidat." },
};

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  CLOSED: "Clôturée",
  ARCHIVED: "Archivée",
};

export const campaignAccessLabels: Record<CampaignAccess, { label: string; hint: string }> = {
  INVITE_ONLY: { label: "Sur invitation", hint: "Seuls les candidats invités par e-mail peuvent participer." },
  LINK: { label: "Par lien", hint: "Toute personne connectée disposant du lien peut participer." },
};

export const resultsVisibilityLabels: Record<ResultsVisibility, { label: string; hint: string }> = {
  HIDDEN: { label: "Aucun résultat", hint: "Le candidat voit seulement que sa participation est enregistrée." },
  SCORE_ONLY: { label: "Score uniquement", hint: "Score global et par épreuve, sans les bonnes réponses." },
  FULL_AFTER_SUBMIT: { label: "Correction après soumission", hint: "Correction détaillée dès la fin de sa tentative." },
  FULL_AFTER_CLOSE: {
    label: "Correction après clôture",
    hint: "Correction détaillée seulement une fois la campagne clôturée : les réponses restent confidentielles pendant la campagne.",
  },
};

/** « 15 min », « 1 h 30 », « 45 s » */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
  if (m) return s ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

export const formatPoints = (value: number) => `${String(Math.round(value * 100) / 100).replace(".", ",")} pt`;
