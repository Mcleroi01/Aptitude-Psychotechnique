import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "CONFIGURATION"
  | "INTERNAL";

export type FieldErrors = Record<string, string[] | undefined>;

/** Erreur métier dont le message peut être montré à l'utilisateur. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionError = { code: ErrorCode; message: string; fieldErrors?: FieldErrors };

/** Résultat uniforme des Server Actions, sérialisable vers le client. */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: ActionError };

const GENERIC_MESSAGE = "Une erreur inattendue est survenue. Veuillez réessayer.";

export function toActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof z.ZodError) {
    return {
      code: "VALIDATION",
      message: "Certaines informations sont invalides.",
      fieldErrors: z.flattenError(error).fieldErrors as FieldErrors,
    };
  }
  console.error("[erreur inattendue]", error);
  return { code: "INTERNAL", message: GENERIC_MESSAGE };
}

/**
 * Exécute une Server Action et convertit toute erreur en ActionResult.
 * Les redirections et notFound() de Next.js sont relancées telles quelles.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: toActionError(error) };
  }
}
