"use client";

import { EllipsisVertical, PauseCircle, PlayCircle, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { changeAccountAction, setOrganizationStatusAction } from "@/features/admin/actions";
import { useMutation } from "@/lib/use-mutation";
import type { OrgStatus, PlatformRole } from "@/generated/prisma/enums";

export function OrganizationStatusButton({ organizationId, name, status }: { organizationId: string; name: string; status: OrgStatus }) {
  const { run, pending } = useMutation();
  const suspend = status === "ACTIVE";
  return (
    <Button
      variant={suspend ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={() => {
        const message = suspend
          ? `Suspendre « ${name} » ? Ses membres perdent l'accès immédiatement et ses campagnes ne sont plus accessibles aux candidats.`
          : `Réactiver « ${name} » ?`;
        if (window.confirm(message)) {
          void run(() => setOrganizationStatusAction(organizationId, suspend ? "SUSPENDED" : "ACTIVE"), {
            success: suspend ? "Organisation suspendue." : "Organisation réactivée.",
          });
        }
      }}
    >
      {suspend ? <PauseCircle data-icon="inline-start" /> : <PlayCircle data-icon="inline-start" />}
      {suspend ? "Suspendre" : "Réactiver"}
    </Button>
  );
}

export function AccountMenu({ userId, email, isActive, role, isSelf }: { userId: string; email: string; isActive: boolean; role: PlatformRole; isSelf: boolean }) {
  const { run, pending } = useMutation();
  const act = (change: Parameters<typeof changeAccountAction>[1], confirmText: string, success: string) => {
    if (window.confirm(confirmText)) void run(() => changeAccountAction(userId, change), { success });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} aria-label={`Actions pour ${email}`}>
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isActive ? (
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onSelect={() => act({ kind: "deactivate" }, `Désactiver le compte ${email} ? La personne sera déconnectée sous 5 minutes.`, "Compte désactivé.")}
          >
            <UserX /> Désactiver
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => act({ kind: "activate" }, `Réactiver le compte ${email} ?`, "Compte réactivé.")}>
            <UserCheck /> Réactiver
          </DropdownMenuItem>
        )}
        {role === "SUPER_ADMIN" ? (
          <DropdownMenuItem
            disabled={isSelf}
            onSelect={() => act({ kind: "role", role: "USER" }, `Retirer les droits d'administration à ${email} ?`, "Droits retirés.")}
          >
            <ShieldOff /> Retirer l&apos;administration
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() =>
              act(
                { kind: "role", role: "SUPER_ADMIN" },
                `Donner à ${email} un accès complet à l'administration de la plateforme ?`,
                "Super-administrateur ajouté.",
              )
            }
          >
            <ShieldCheck /> Nommer super-administrateur
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
