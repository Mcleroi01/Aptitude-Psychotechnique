"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Archive, EllipsisVertical, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteQuestionAction, setQuestionStatusAction } from "@/features/questions/actions";
import type { BankRef } from "@/features/questions/bank";
import type { ContentStatus } from "@/generated/prisma/enums";

export function QuestionRowActions({
  bank,
  questionId,
  status,
  editHref,
}: {
  bank: BankRef;
  questionId: string;
  status: ContentStatus;
  editHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const changeStatus = (next: ContentStatus, message: string) =>
    startTransition(async () => {
      const result = await setQuestionStatusAction(bank, questionId, next);
      if (result.ok) {
        toast.success(message);
        router.refresh();
      } else toast.error(result.error.message);
    });

  const remove = () =>
    startTransition(async () => {
      const result = await deleteQuestionAction(bank, questionId);
      if (!result.ok) return void toast.error(result.error.message);
      toast.success(
        result.data === "deleted" ? "Question supprimée." : "Question déjà utilisée : elle a été archivée pour préserver les résultats.",
      );
      router.refresh();
    });

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending} aria-label="Actions sur la question">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil /> Modifier
            </Link>
          </DropdownMenuItem>
          {status === "PUBLISHED" ? (
            <DropdownMenuItem onSelect={() => changeStatus("DRAFT", "Question repassée en brouillon.")}>
              <EyeOff /> Repasser en brouillon
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => changeStatus("PUBLISHED", "Question publiée.")}>
              <Eye /> Publier
            </DropdownMenuItem>
          )}
          {status !== "ARCHIVED" && (
            <DropdownMenuItem onSelect={() => changeStatus("ARCHIVED", "Question archivée.")}>
              <Archive /> Archiver
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive">
              <Trash2 /> Supprimer
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette question ?</AlertDialogTitle>
          <AlertDialogDescription>
            Si elle n&apos;a jamais été utilisée, elle sera supprimée définitivement. Si elle figure dans une évaluation ou
            dans des résultats, elle sera archivée pour les préserver.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
