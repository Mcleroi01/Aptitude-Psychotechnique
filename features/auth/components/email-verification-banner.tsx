"use client";

import { useTransition } from "react";
import { Loader2, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/features/auth/actions";

/** Affiché tant que l'adresse e-mail n'est pas confirmée. */
export function EmailVerificationBanner({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();

  const resend = () =>
    startTransition(async () => {
      const result = await resendVerificationAction();
      if (result.ok) toast.success(`Lien envoyé à ${email}.`);
      else toast.error(result.error.message);
    });

  return (
    <div className="border-b border-warning/30 bg-warning/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2.5">
          <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Confirmez votre adresse <strong className="font-semibold">{email}</strong> via le lien reçu par e-mail.
          </span>
        </p>
        <Button variant="outline" size="sm" onClick={resend} disabled={pending} className="self-start sm:self-auto">
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Renvoyer le lien
        </Button>
      </div>
    </div>
  );
}
