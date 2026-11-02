"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerCompanyAction } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { PasswordInput } from "@/features/auth/components/password-input";
import { companyRegisterSchema, type CompanyRegisterInput } from "@/schemas/auth";

const fields = ["organizationName", "name", "email", "password", "confirmPassword"] as const;

export function CompanyRegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<CompanyRegisterInput>({
    resolver: zodResolver(companyRegisterSchema),
    defaultValues: { organizationName: "", name: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerCompanyAction(values);
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
        <Field data-invalid={Boolean(errors.organizationName)}>
          <FieldLabel htmlFor="organizationName">Nom de l&apos;organisation</FieldLabel>
          <Input
            id="organizationName"
            autoComplete="organization"
            placeholder="Entreprise, cabinet, école…"
            aria-invalid={Boolean(errors.organizationName)}
            className="h-11"
            {...form.register("organizationName")}
          />
          <FieldError errors={[errors.organizationName]} />
        </Field>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="name">Votre nom</FieldLabel>
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
          <FieldLabel htmlFor="email">Adresse e-mail professionnelle</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@entreprise.cd"
            aria-invalid={Boolean(errors.email)}
            className="h-11"
            {...form.register("email")}
          />
          <FieldDescription>Un lien de confirmation vous sera envoyé.</FieldDescription>
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
        Créer l&apos;espace organisation
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-primary underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
