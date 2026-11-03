"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmLoginLinkAction } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";

/** Le lien n'est consommé qu'au clic : un antivirus qui ouvre le lien ne connecte personne. */
export function ConfirmLoginLink({ token, callbackUrl }: { token: string; callbackUrl?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <FormAlert message={error} />
      <Button
        size="xl"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await confirmLoginLinkAction(token, callbackUrl);
            if (result && !result.ok) setError(result.error.message);
          })
        }
      >
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Continuer <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}
