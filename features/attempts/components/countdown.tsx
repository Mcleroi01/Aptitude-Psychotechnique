"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compte à rebours d'affichage. L'échéance vient du serveur ; `offsetMs`
 * corrige l'écart entre l'horloge du poste et celle du serveur.
 */
export function Countdown({ deadline, offsetMs, onExpire }: { deadline: string; offsetMs: number; onExpire: () => void }) {
  const remaining = () => Math.max(0, new Date(deadline).getTime() - (Date.now() + offsetMs));
  const [ms, setMs] = useState(remaining);
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expired.current = false;
    const tick = () => {
      const value = Math.max(0, new Date(deadline).getTime() - (Date.now() + offsetMs));
      setMs(value);
      if (value === 0 && !expired.current) {
        expired.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [deadline, offsetMs]);

  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const text = `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <span
      role="timer"
      aria-label={`Temps restant : ${text}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular",
        total <= 60 ? "bg-destructive/10 text-destructive" : total <= 300 ? "bg-warning/15 text-warning-foreground" : "bg-muted",
      )}
    >
      <Timer className="size-4" aria-hidden />
      {text}
    </span>
  );
}
