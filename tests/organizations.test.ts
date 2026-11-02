import { describe, expect, it } from "vitest";
import { can, orgPermissions } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { companyRegisterSchema, createOrganizationSchema } from "@/schemas/auth";

describe("slugify", () => {
  it("retire les accents et la ponctuation", () => {
    expect(slugify("Société Générale d'Électricité")).toBe("societe-generale-d-electricite");
  });

  it("borne la longueur sans finir par un tiret", () => {
    const slug = slugify("a".repeat(39) + " bcd");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("fournit une valeur par défaut si le nom ne contient aucun caractère utilisable", () => {
    expect(slugify("¡¿!?")).toBe("organisation");
  });
});

describe("permissions d'organisation", () => {
  it("réserve la gestion de l'organisation au propriétaire", () => {
    expect(can("OWNER", "organization:manage")).toBe(true);
    expect(can("ADMIN", "organization:manage")).toBe(false);
  });

  it("limite le correcteur à la notation", () => {
    const allowed = Object.keys(orgPermissions).filter((p) => can("GRADER", p as keyof typeof orgPermissions));
    expect(allowed).toEqual(["answers:grade"]);
  });

  it("n'autorise pas le recruteur à gérer les membres", () => {
    expect(can("RECRUITER", "members:manage")).toBe(false);
    expect(can("RECRUITER", "questions:write")).toBe(true);
  });
});

describe("schémas d'inscription entreprise", () => {
  const valid = {
    organizationName: "  Cabinet Kongo RH  ",
    name: "Awa Mbuyi",
    email: "AWA@Exemple.cd",
    password: "motdepasse1",
    confirmPassword: "motdepasse1",
  };

  it("normalise le nom d'organisation et l'e-mail", () => {
    const data = companyRegisterSchema.parse(valid);
    expect(data.organizationName).toBe("Cabinet Kongo RH");
    expect(data.email).toBe("awa@exemple.cd");
  });

  it("refuse des mots de passe différents", () => {
    const result = companyRegisterSchema.safeParse({ ...valid, confirmPassword: "autre1234" });
    expect(result.success).toBe(false);
  });

  it("refuse un nom d'organisation sans lettre ni chiffre", () => {
    expect(createOrganizationSchema.safeParse({ organizationName: "---" }).success).toBe(false);
  });
});
