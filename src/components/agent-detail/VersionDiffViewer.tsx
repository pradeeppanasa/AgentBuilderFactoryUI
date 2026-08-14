import { Badge } from "@/components/common";
import type { ImpactLevel, VersionDiffResponse } from "@/types/agent";

const IMPACT_VARIANT: Record<
  ImpactLevel,
  "success" | "warning" | "destructive"
> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "destructive",
  CRITICAL: "destructive",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function VersionDiffViewer({ diff }: { diff: VersionDiffResponse }) {
  const { config_diff, impact_analysis } = diff;
  const hasChanges =
    config_diff.changed.length > 0 ||
    config_diff.added.length > 0 ||
    config_diff.removed.length > 0;

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <Badge variant={IMPACT_VARIANT[impact_analysis.impact_level]}>
          {impact_analysis.impact_level} IMPACT
        </Badge>
        {impact_analysis.required_validations.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            Requires: {impact_analysis.required_validations.join(", ")}
          </span>
        ) : null}
      </div>

      {!hasChanges ? (
        <p className="text-sm text-muted-foreground">
          No configuration changes from the previous version.
        </p>
      ) : (
        <div className="space-y-2 text-sm">
          {config_diff.changed.map((entry) => (
            <div key={`changed-${entry.field}`} className="flex flex-wrap gap-2">
              <span className="font-mono text-xs text-navy">{entry.field}</span>
              <span className="text-muted-foreground line-through">
                {formatValue(entry.from)}
              </span>
              <span className="text-teal">→</span>
              <span>{formatValue(entry.to)}</span>
            </div>
          ))}
          {config_diff.added.map((entry) => (
            <div key={`added-${entry.field}`} className="flex flex-wrap gap-2">
              <Badge variant="success">+ added</Badge>
              <span className="font-mono text-xs text-navy">{entry.field}</span>
              <span>{formatValue(entry.value)}</span>
            </div>
          ))}
          {config_diff.removed.map((entry) => (
            <div key={`removed-${entry.field}`} className="flex flex-wrap gap-2">
              <Badge variant="destructive">− removed</Badge>
              <span className="font-mono text-xs text-navy">{entry.field}</span>
              <span className="text-muted-foreground">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
