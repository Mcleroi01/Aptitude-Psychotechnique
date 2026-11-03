"use client";

import { useState, useTransition } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestLoginLinkAction } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { emailLinkSchema } from "@/schemas/auth";

/**
 * Connexion ou création de compte sans mot de passe : un lien valable 15 minutes
 * est envoyé par e-mail. La réponse est la même que l'adresse ait un compte ou non.
 */
export function EmailLinkForm({ mode, callbackUrl }: { mode: "login" | "register"; callbackUrl?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    const parsed = emailLinkSchema.safeParse({ email, name: mode === "register" ? name : undefined });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], name: flat.name?.[0] });
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await requestLoginLinkAction(parsed.data, callbackUrl);
      if (result.ok) setSentTo(parsed.data.email);
      else setServerError(result.error.message);
    });
  };

  if (sentTo) {
    return (
      <div className="rounded-xl border bg-card p-5" role="status">
        <p className="flex items-center gap-2 font-medium">
          <MailCheck className="size-5 text-success" aria-hidden /> Vérifiez votre boîte mail
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si l&apos;adresse <strong className="text-foreground">{sentTo}</strong> est valide, un lien vient d&apos;y être envoyé. Il
          est valable 15 minutes. Pensez à regarder dans les courriers indésirables.
        </p>
        <Button variant="link" className="mt-2 h-auto px-0" onClick={() => setSentTo(null)}>
          Utiliser une autre adresse
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormAlert message={serverError} />
      <FieldGroup>
        {mode === "register" && (
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="link-name">Nom complet</FieldLabel>
            <Input id="link-name" autoComplete="name" placeholder="Prénom et nom" className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
            <FieldError errors={errors.name ? [{ message: errors.name }] : undefined} />
          </Field>
        )}
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="link-email">Adresse e-mail</FieldLabel>
          <Input
            id="link-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="h-11"
            aria-invalid={Boolean(errors.email)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError errors={errors.email ? [{ message: errors.email }] : undefined} />
        </Field>
      </FieldGroup>
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        {mode === "register" ? "Recevoir mon lien de création" : "Recevoir un lien de connexion"}
      </Button>
    </form>
  );
}
