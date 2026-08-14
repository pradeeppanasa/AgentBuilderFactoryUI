import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  label?: string;
}

export function LoadingSpinner({
  className,
  size = 20,
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <Loader2 size={size} className="animate-spin text-teal" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
