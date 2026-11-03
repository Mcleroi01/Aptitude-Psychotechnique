import { describe, expect, it } from "vitest";
import { parseInvitees } from "@/lib/invitations";
import { documentSchema } from "@/lib/library";

describe("liste de candidats collée", () => {
  it("lit les formats courants et normalise les adresses", () => {
    const { invitees, invalid } = parseInvitees(
      ["awa.mbuyi@exemple.com", "Jean Kabila <Jean.Kabila@Exemple.com>", "marie@exemple.com ; Marie Lukusa", "Paul Mutombo, paul@exemple.com", ""].join("\n"),
    );
    expect(invalid).toEqual([]);
    expect(invitees).toEqual([
      { email: "awa.mbuyi@exemple.com", name: null },
      { email: "jean.kabila@exemple.com", name: "Jean Kabila" },
      { email: "marie@exemple.com", name: "Marie Lukusa" },
      { email: "paul@exemple.com", name: "Paul Mutombo" },
    ]);
  });

  it("fusionne les doublons et renvoie les lignes invalides", () => {
    const { invitees, invalid } = parseInvitees("a@exemple.com\nA@exemple.com\npas une adresse\nb@@exemple");
    expect(invitees).toHaveLength(1);
    expect(invalid).toEqual(["pas une adresse", "b@@exemple"]);
  });
});

describe("document de bibliothèque", () => {
  const base = {
    title: "Fiche méthode pourcentages",
    description: "",
    category: "PREPARATION",
    source: "Équipe Aptitude",
    documentDate: null,
    verificationStatus: "PLATFORM_CONTENT",
    requiresAuth: false,
    isPublished: true,
  };

  it("accepte une ressource de la plateforme", () => {
    expect(documentSchema.safeParse(base).success).toBe(true);
  });

  it("exige une source précise pour un document dit officiel", () => {
    expect(documentSchema.safeParse({ ...base, category: "COMMUNIQUE", verificationStatus: "OFFICIAL_VERIFIED", source: "Site" }).success).toBe(false);
    expect(
      documentSchema.safeParse({ ...base, category: "COMMUNIQUE", verificationStatus: "OFFICIAL_VERIFIED", source: "https://www.exemple.org/avis-2027" }).success,
    ).toBe(true);
  });

  it("refuse une date mal formée", () => {
    expect(documentSchema.safeParse({ ...base, documentDate: "03/11/2026" }).success).toBe(false);
  });
});
