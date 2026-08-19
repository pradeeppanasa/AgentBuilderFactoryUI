import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { getRunLogs } from "@/api/runs";
import { Button, LoadingSpinner } from "@/components/common";
import { cn } from "@/lib/utils";
import type { ActivityLevel } from "@/types/runs";

// Observability — Runs Feature, Phase 3, Section 8. No real CloudWatch
// Logs Insights proxy exists yet in this environment (see
// app/modules/runs/models.py's LogLine docstring) — this reads the same
// already-sanitised source as the Activity Feed, formatted as log lines.
// R30: never contains prompt/response/RAG/PII/secret content — enforced at
// the point the ActivityEvent was originally written, not here.

const LEVEL_FILTERS: { value: ActivityLevel | "ALL"; label: string }[] = [
  { value: "ALL", label: "ALL" },
  { value: "INFO", label: "INFO" },
  { value: "WARNING", label: "WARNING" },
  { value: "ERROR", label: "ERROR" },
  { value: "DEBUG", label: "DEBUG" },
];

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function LogsTab({ agentId, runId }: { agentId: string; runId: string }) {
  const [levelFilter, setLevelFilter] = useState<ActivityLevel | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["agents", agentId, "runs", runId, "logs"],
    queryFn: () => getRunLogs(agentId, runId),
  });

  const filtered = useMemo(() => {
    const lines = data?.lines ?? [];
    return lines.filter((line) => {
      if (levelFilter !== "ALL" && line.level !== levelFilter) return false;
      if (search && !line.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data?.lines, levelFilter, search]);

  if (isLoading) return <LoadingSpinner label="Loading logs…" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {LEVEL_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setLevelFilter(f.value)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                levelFilter === f.value
                  ? "bg-teal text-white"
                  : "bg-muted text-muted-foreground hover:text-navy",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadTextFile(
                `${runId}-logs.txt`,
                filtered.map((l) => `${l.timestamp}  ${l.level.padEnd(7)}  ${l.message}`).join("\n"),
              )
            }
          >
            <Download size={12} />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-0.5 rounded-md border border-border bg-card p-3 font-mono text-[11px]">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No log lines match this filter.</p>
        ) : (
          filtered.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 text-muted-foreground">{line.timestamp}</span>
              <span
                className={cn(
                  "w-16 shrink-0 font-semibold",
                  line.level === "ERROR"
                    ? "text-destructive"
                    : line.level === "WARNING"
                      ? "text-amber-700"
                      : "text-muted-foreground",
                )}
              >
                {line.level}
              </span>
              <span className="text-navy">{line.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
