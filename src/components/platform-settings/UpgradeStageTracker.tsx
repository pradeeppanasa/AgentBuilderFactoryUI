import { Badge } from "@/components/common";
import { UPGRADE_STAGE_LABELS, UPGRADE_STAGE_ORDER } from "@/types/platform";
import type { PlatformUpgradeRecord, UpgradeStageStatus } from "@/types/platform";

const STAGE_VARIANT: Record<
  UpgradeStageStatus,
  "success" | "warning" | "destructive" | "secondary" | "accent"
> = {
  PENDING: "secondary",
  RUNNING: "accent",
  PASSED: "success",
  FAILED: "destructive",
};

export function UpgradeStageTracker({ upgrade }: { upgrade: PlatformUpgradeRecord }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {UPGRADE_STAGE_ORDER.map((stageName) => {
        const stage = upgrade.stages[stageName];
        const stageStatus = stage?.status ?? "PENDING";
        return (
          <div key={stageName} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-center gap-3">
              <Badge variant={STAGE_VARIANT[stageStatus]}>{stageStatus}</Badge>
              <span className="text-sm font-medium text-navy">
                {UPGRADE_STAGE_LABELS[stageName] ?? stageName}
              </span>
            </div>
            {stage?.output_summary ? (
              <p className="pl-1 text-xs text-muted-foreground">
                {stage.output_summary}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
