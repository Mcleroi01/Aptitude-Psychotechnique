import type { CampaignStatus, ResultsVisibility } from "@/generated/prisma/enums";

export type ResultAccess = "full" | "score" | "none";

/**
 * Ce que le candidat peut voir de sa tentative terminée. Entraînement et
 * examens blancs de la plateforme : correction complète. Campagne : selon le
 * choix de l'organisation ; « après clôture » ne montre que le score tant que
 * la campagne est ouverte, pour garder les réponses confidentielles.
 */
export function resultAccess(
  campaign: { resultsVisibility: ResultsVisibility; status: CampaignStatus; closesAt: Date | null } | null,
  now: Date = new Date(),
): ResultAccess {
  if (!campaign) return "full";
  switch (campaign.resultsVisibility) {
    case "HIDDEN":
      return "none";
    case "SCORE_ONLY":
      return "score";
    case "FULL_AFTER_SUBMIT":
      return "full";
    case "FULL_AFTER_CLOSE": {
      const closed = campaign.status === "CLOSED" || campaign.status === "ARCHIVED" || (campaign.closesAt !== null && campaign.closesAt <= now);
      return closed ? "full" : "score";
    }
  }
}
