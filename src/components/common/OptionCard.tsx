import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

// Card-based selection (UI Principle #2) — used everywhere a choice matters:
// model provider, tool add method, output format, memory type, KB source.
export function OptionCard({
  icon: Icon,
  label,
  description,
  selected,
  disabled = false,
  onClick,
}: OptionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-teal bg-teal/5 ring-1 ring-teal"
          : "border-border bg-card hover:border-teal/40",
      )}
    >
      <Icon size={20} className={selected ? "text-teal" : "text-muted-foreground"} />
      <div>
        <p className={cn("text-sm font-medium", selected ? "text-navy" : "text-navy/80")}>
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </button>
  );
}
