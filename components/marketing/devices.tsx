import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Cadre d'ordinateur portable (purement décoratif). */
export function LaptopFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative text-left", className)} aria-hidden>
      <div className="rounded-t-[1.1rem] border border-white/15 bg-[#1b2333] p-[1.2%] shadow-2xl shadow-black/50">
        <div className="overflow-hidden rounded-[0.45rem] bg-white">{children}</div>
      </div>
      <div className="relative mx-[-6%] h-3 rounded-b-xl bg-gradient-to-b from-[#c9ced8] to-[#8d94a3] sm:h-4">
        <div className="absolute top-0 left-1/2 h-1.5 w-1/6 -translate-x-1/2 rounded-b-md bg-[#a7adb9]" />
      </div>
    </div>
  );
}

/** Cadre de téléphone (purement décoratif). */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-[2rem] border border-white/15 bg-[#1b2333] p-1.5 shadow-2xl shadow-black/60", className)}
      aria-hidden
    >
      <div className="relative overflow-hidden rounded-[1.6rem] bg-white">
        <div className="absolute top-1.5 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1b2333]" />
        {children}
      </div>
    </div>
  );
}
