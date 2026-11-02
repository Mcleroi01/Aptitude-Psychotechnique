"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";

/**
 * La confirmation exige un clic : les antivirus de messagerie qui ouvrent les
 * liens automatiquement ne peuvent pas consommer le jeton à la place de l'utilisateur.
 */
export function VerifyEmailForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      setError(null);
      const result = await verifyEmailAction(token);
      if (result.ok) setStatus("done");
      else setError(result.error.message);
    });

  if (status === "done") {
    return (
      <div className="space-y-6">
        <p className="flex items-center gap-2.5 font-medium text-success">
          <CircleCheck className="size-5" aria-hidden /> Adresse e-mail confirmée.
        </p>
        <Button asChild size="xl" className="w-full">
          <Link href="/espace">Accéder à mon espace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FormAlert message={error} />
      <Button size="xl" className="w-full" onClick={confirm} disabled={pending}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Confirmer mon adresse
      </Button>
    </div>
  );
}
