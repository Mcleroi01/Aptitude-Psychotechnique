"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/errors";

/**
 * Exécute une Server Action, affiche le résultat et rafraîchit les données
 * serveur. Le serveur reste la source de vérité : pas d'état local dupliqué.
 */
export function useMutation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = <T>(
    action: () => Promise<ActionResult<T>>,
    options: { success?: string | ((data: T) => string); onError?: (result: Extract<ActionResult<T>, { ok: false }>) => void } = {},
  ) =>
    new Promise<boolean>((resolve) =>
      startTransition(async () => {
        const result = await action();
        // Une redirection serveur ne renvoie pas de résultat.
        if (!result) return resolve(true);
        if (!result.ok) {
          if (options.onError) options.onError(result);
          else toast.error(result.error.message);
          return resolve(false);
        }
        const message = typeof options.success === "function" ? options.success(result.data) : options.success;
        if (message) toast.success(message);
        router.refresh();
        resolve(true);
      }),
    );

  return { run, pending };
}
