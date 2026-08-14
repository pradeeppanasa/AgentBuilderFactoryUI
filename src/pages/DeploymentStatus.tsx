import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDeployment } from "@/api/deployments";
import { Badge, LoadingSpinner } from "@/components/common";
import { StageTracker } from "@/components/deployment-status/StageTracker";
import { isTerminalDeploymentStatus } from "@/types/deployment";
import type { DeploymentStatus as DeploymentStatusValue } from "@/types/deployment";

const STATUS_VARIANT: Record<
  DeploymentStatusValue,
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

export default function DeploymentStatus() {
  const { deploymentId } = useParams<{ deploymentId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["deployments", deploymentId],
    queryFn: () => getDeployment(deploymentId as string),
    enabled: Boolean(deploymentId),
    refetchInterval: (query) =>
      query.state.data && isTerminalDeploymentStatus(query.state.data.status)
        ? false
        : 10000,
  });

  if (!deploymentId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-navy">Deployments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          There's no cross-agent deployment list yet — open an agent and use
          its Deployment History section to find a specific deployment.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading deployment…" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Deployment not found or could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-navy">
            {data.deployment_id}
          </h1>
          <Badge variant={STATUS_VARIANT[data.status]}>{data.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          <Link to={`/agents/${data.agent_id}`} className="hover:text-teal">
            {data.agent_id}
          </Link>{" "}
          · v{data.version} · triggered by {data.triggered_by} on{" "}
          {new Date(data.triggered_at).toLocaleString()}
        </p>
      </div>

      {data.failure_reason ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-medium">
            {data.failed_stage ? `${data.failed_stage}: ` : ""}
          </span>
          {data.failure_reason}
        </div>
      ) : null}

      <StageTracker deployment={data} />

      {!isTerminalDeploymentStatus(data.status) ? (
        <p className="text-xs text-muted-foreground">
          Refreshing every 10 seconds while the pipeline runs…
        </p>
      ) : null}
    </div>
  );
}
