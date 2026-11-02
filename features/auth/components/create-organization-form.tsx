"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createOrganizationAction } from "@/features/auth/actions";
import { FormAlert } from "@/features/auth/components/form-alert";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/schemas/auth";

export function CreateOrganizationForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { organizationName: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createOrganizationAction(values);
      if (!result || result.ok) return;
      const message = result.error.fieldErrors?.organizationName?.[0];
      if (message) form.setError("organizationName", { message });
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
      </FieldGroup>
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Créer l&apos;organisation
      </Button>
    </form>
  );
}
