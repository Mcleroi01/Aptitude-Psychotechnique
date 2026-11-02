import "server-only";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { RegisterInput } from "@/schemas/auth";

const BCRYPT_COST = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** Crée un compte. Le rôle SUPER_ADMIN ne peut jamais être obtenu par l'inscription. */
export async function createUser(input: Pick<RegisterInput, "name" | "email" | "password">) {
  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        platformRole: "USER",
      },
      select: { id: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("CONFLICT", "Un compte existe déjà avec cette adresse e-mail.", {
        email: ["Cette adresse est déjà utilisée"],
      });
    }
    throw error;
  }
}
