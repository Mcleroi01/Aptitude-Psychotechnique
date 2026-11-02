import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, runAction, toActionError } from "@/lib/errors";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { categories } from "@/prisma/seed-data/categories";

describe("gestion centralisée des erreurs", () => {
  it("transmet le message d'une AppError", () => {
    expect(toActionError(new AppError("FORBIDDEN", "Accès refusé"))).toEqual({
      code: "FORBIDDEN",
      message: "Accès refusé",
      fieldErrors: undefined,
    });
  });

  it("convertit une ZodError en erreurs de champ", () => {
    const result = z.object({ email: z.email() }).safeParse({ email: "x" });
    const error = toActionError(result.error);
    expect(error.code).toBe("VALIDATION");
    expect(error.fieldErrors?.email?.length).toBeGreaterThan(0);
  });

  it("masque les erreurs inattendues", async () => {
    const original = console.error;
    console.error = () => {};
    const result = await runAction(async () => {
      throw new Error("détail interne sensible");
    });
    console.error = original;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
      expect(result.error.message).not.toContain("sensible");
    }
  });

  it("renvoie les données en cas de succès", async () => {
    expect(await runAction(async () => 42)).toEqual({ ok: true, data: 42 });
  });
});

describe("schémas d'authentification", () => {
  it("normalise l'e-mail de connexion", () => {
    expect(loginSchema.parse({ email: "  Candidat@Exemple.CD ", password: "x" }).email).toBe("candidat@exemple.cd");
  });

  it("exige un mot de passe robuste et confirmé à l'inscription", () => {
    const base = { name: "Awa", email: "awa@exemple.cd" };
    expect(registerSchema.safeParse({ ...base, password: "court", confirmPassword: "court" }).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "motdepasse1", confirmPassword: "motdepasse2" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "motdepasse1", confirmPassword: "motdepasse1" }).success,
    ).toBe(true);
  });
});

describe("données initiales", () => {
  it("définit les huit catégories avec des slugs uniques", () => {
    expect(categories).toHaveLength(8);
    expect(new Set(categories.map((c) => c.slug)).size).toBe(8);
  });
});
