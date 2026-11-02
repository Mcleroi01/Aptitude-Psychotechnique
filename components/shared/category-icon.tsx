import {
  ArrowUpDown,
  Brain,
  Calculator,
  Divide,
  ListOrdered,
  Percent,
  Puzzle,
  Scale,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  "list-ordered": ListOrdered,
  brain: Brain,
  puzzle: Puzzle,
  percent: Percent,
  divide: Divide,
  scale: Scale,
  "arrow-up-down": ArrowUpDown,
  calculator: Calculator,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && icons[name]) || Shapes;
  return <Icon className={cn("size-5", className)} aria-hidden />;
}
