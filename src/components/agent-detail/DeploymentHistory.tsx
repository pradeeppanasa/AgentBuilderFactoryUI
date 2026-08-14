import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listAgentDeployments } from "@/api/agents";
import { Badge, LoadingSpinner } from "@/components/common";
import {
  DEPLOYMENT_STAGE_LABELS,
  isTerminalDeploymentStatus,
} from "@/types/deployment";
import type { DeploymentRecord, DeploymentStatus } from "@/types/deployment";

const DEPLOYMENT_STATUS_VARIANT: Record<
  DeploymentStatus,
  "success" | "warning" | "destructive" | "secondary" | "accent"
> = {
  PENDING: "secondary",
  VALIDATING: "accent",
  CHANGE_IMPACT: "accent",
  GENERATING_IAC: "accent",
  SECURITY_SCANNING: "accent",
  EVALUATING: "accent",
  TERRAFORM_VALIDATE: "accent",
  TERRAFORM_PLAN: "accent",
  POLICY_CHECK: "accent",
  APPLYING: "accent",
  DEPLOYING: "accent",
  HEALTH_CHECK: "accent",
  ACTIVE: "success",
  FAILED: "destructive",
  BLOCKED: "destructive",
};

function stageLabel(stage: string): string {
  return DEPLOYMENT_STAGE_LABELS[stage] ?? stage;
}

/** The stage worth showing per row: where a finished deployment stopped, or
 *  where a running one currently is. */
function describeStage(
  deployment: DeploymentRecord,
): { label: string; failed: boolean } | null {
  const failed = deployment.status === "FAILED" || deployment.status === "BLOCKED";
  // failed_stage is the precise answer, but fall back to current_stage: a
  // BLOCKED record that never got failed_stage populated should still say
  // where it stopped.
  const stage = deployment.failed_stage ?? deployment.current_stage;
  if (!stage) return null;
  if (failed) return { label: `Failed at ${stageLabel(stage)}`, failed: true };
  // ACTIVE — every stage passed, so the stage adds nothing the status badge
  // does not already say.
  if (isTerminalDeploymentStatus(deployment.status)) return null;
  return { label: `Stage: ${stageLabel(stage)}`, failed: false };
}

export function DeploymentHistory({ agentId }: { agentId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["agents", agentId, "deployments"],
    queryFn: () => listAgentDeployments(agentId),
    // Now that each row shows a stage, keep it live while any pipeline is
    // still running — same 10s cadence as the DeploymentStatus page.
    refetchInterval: (query) =>
      query.state.data?.items.some(
        (item) => !isTerminalDeploymentStatus(item.status),
      )
        ? 10000
        : false,
  });

  if (isLoading) return <LoadingSpinner label="Loading deployments…" />;
  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load deployment history.
      </p>
    );
  }
  if (!data || data.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No deployments yet for this agent.
      </p>
    );
  }

  const sorted = [...data.items].sort((a, b) =>
    b.triggered_at.localeCompare(a.triggered_at),
  );

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {sorted.map((deployment) => {
        const stage = describeStage(deployment);
        return (
          <Link
            key={deployment.deployment_id}
            to={`/deployments/${deployment.deployment_id}`}
            className="block px-4 py-3 text-sm hover:bg-muted/30"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={DEPLOYMENT_STATUS_VARIANT[deployment.status]}>
                {deployment.status}
              </Badge>
              <span className="font-mono text-xs text-navy">
                {deployment.deployment_id}
              </span>
              <span className="text-muted-foreground">v{deployment.version}</span>
              {stage ? (
                <span
                  className={
                    stage.failed ? "text-xs text-destructive" : "text-xs text-teal"
                  }
                >
                  {stage.label}
                </span>
              ) : null}
              <span className="ml-auto text-xs text-muted-foreground">
                {deployment.triggered_by}
              </span>
            </div>

            <dl className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <div className="flex gap-1.5">
                <dt>Triggered</dt>
                <dd className="text-foreground">
                  {new Date(deployment.triggered_at).toLocaleString()}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Last updated</dt>
                <dd className="text-foreground">
                  {new Date(deployment.updated_at).toLocaleString()}
                </dd>
              </div>
            </dl>

            {deployment.failure_reason ? (
              <p className="mt-1.5 text-xs text-destructive">
                {deployment.failure_reason}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
