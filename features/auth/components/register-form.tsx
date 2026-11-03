"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { PasswordInput } from "@/features/auth/components/password-input";
import { registerSchema, type RegisterInput } from "@/schemas/auth";

const fields = ["name", "email", "password", "confirmPassword"] as const;

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (!result || result.ok) return;
      for (const field of fields) {
        const message = result.error.fieldErrors?.[field]?.[0];
        if (message) form.setError(field, { message });
      }
      setServerError(result.error.message);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={serverError} />
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="name">Nom complet</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Prénom et nom"
            aria-invalid={Boolean(errors.name)}
            className="h-11"
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Adresse e-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.cd"
            aria-invalid={Boolean(errors.email)}
            className="h-11"
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            className="h-11"
            {...form.register("password")}
          />
          <FieldDescription>8 caractères minimum, avec au moins une lettre et un chiffre.</FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            className="h-11"
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
      </FieldGroup>
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Créer mon compte
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        En créant un compte, vous reconnaissez que cette plateforme est indépendante et n&apos;est affiliée à aucun
        recruteur.
      </p>
    </form>
  );
}
