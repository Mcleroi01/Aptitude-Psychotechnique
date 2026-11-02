"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Une erreur est survenue</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Le problème a été enregistré. Vous pouvez réessayer ; si l&apos;erreur persiste, revenez dans quelques instants.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Référence : {error.digest}</p>}
      <Button className="mt-8" onClick={reset}>
        Réessayer
      </Button>
    </main>
  );
}
