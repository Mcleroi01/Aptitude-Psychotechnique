"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Bascule entre connexion par lien e-mail (par défaut) et par mot de passe. */
export function AuthMethodTabs({ emailLink, password }: { emailLink: React.ReactNode; password: React.ReactNode }) {
  const [method, setMethod] = useState<"link" | "password">("link");
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Méthode" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
        {(
          [
            ["link", "Lien par e-mail"],
            ["password", "Mot de passe"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={method === value}
            onClick={() => setMethod(value)}
            className={cn(
              "rounded-md px-3 py-2 font-medium transition-colors",
              method === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{method === "link" ? emailLink : password}</div>
    </div>
  );
}
