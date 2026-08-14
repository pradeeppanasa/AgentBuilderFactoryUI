import { Badge } from "@/components/common";
import {
  DEPLOYMENT_STAGE_LABELS,
  DEPLOYMENT_STAGE_ORDER,
} from "@/types/deployment";
import type { DeploymentRecord, StageStatus } from "@/types/deployment";

const STAGE_VARIANT: Record<
  StageStatus,
  "success" | "warning" | "destructive" | "secondary" | "accent"
> = {
  PENDING: "secondary",
  RUNNING: "accent",
  PASSED: "success",
  FAILED: "destructive",
  SKIPPED: "secondary",
  BLOCKED: "destructive",
};

export function StageTracker({ deployment }: { deployment: DeploymentRecord }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {DEPLOYMENT_STAGE_ORDER.map((stageName) => {
        const stage = deployment.stages[stageName];
        const stageStatus = stage?.status ?? "PENDING";
        return (
          <div key={stageName} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-center gap-3">
              <Badge variant={STAGE_VARIANT[stageStatus]}>{stageStatus}</Badge>
              <span className="text-sm font-medium text-navy">
                {DEPLOYMENT_STAGE_LABELS[stageName] ?? stageName}
              </span>
            </div>
            {stage?.output_summary ? (
              <p className="pl-1 text-xs text-muted-foreground">
                {stage.output_summary}
              </p>
            ) : null}
            {stage?.blocking_issue ? (
              <p className="pl-1 text-xs text-destructive">
                {stage.blocking_issue}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
