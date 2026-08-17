import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchivedToggleProps {
  showArchived: boolean;
  onChange: (next: boolean) => void;
  archivedCount?: number;
}

// Section 38.11: "on every list page ... add a filter/toggle that reveals
// archived items in a muted style."
export function ArchivedToggle({ showArchived, onChange, archivedCount }: ArchivedToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!showArchived)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        showArchived
          ? "border-teal bg-teal/5 text-teal"
          : "border-border text-muted-foreground hover:border-teal/40",
      )}
    >
      <Archive size={13} />
      {showArchived ? "Hide archived" : "Show archived"}
      {typeof archivedCount === "number" && archivedCount > 0 ? (
        <span className="rounded-full bg-muted px-1.5 text-[10px]">{archivedCount}</span>
      ) : null}
    </button>
  );
}
