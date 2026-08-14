import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { getVersionDiff, rollbackAgent } from "@/api/agents";
import { Badge, Button, LoadingSpinner } from "@/components/common";
import { VersionDiffViewer } from "./VersionDiffViewer";
import type { AgentVersionSummary, VersionStatus } from "@/types/agent";

const VERSION_STATUS_VARIANT: Record<
  VersionStatus,
  "success" | "warning" | "destructive" | "secondary" | "accent"
> = {
  DRAFT: "secondary",
  TESTING: "warning",
  BLOCKED: "destructive",
  LIVE: "success",
  SUPERSEDED: "secondary",
  ROLLED_BACK: "warning",
};

interface VersionTimelineProps {
  agentId: string;
  currentVersion: number;
  versions: AgentVersionSummary[];
  canWrite: boolean;
}

function VersionRow({
  agentId,
  currentVersion,
  version,
  canWrite,
}: {
  agentId: string;
  currentVersion: number;
  version: AgentVersionSummary;
  canWrite: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: diff, isLoading: diffLoading } = useQuery({
    queryKey: ["agents", agentId, "versions", version.version, "diff"],
    queryFn: () => getVersionDiff(agentId, version.version),
    enabled: expanded,
  });

  const rollbackMutation = useMutation({
    mutationFn: (reason: string) =>
      rollbackAgent(agentId, { target_version: version.version, reason }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
      // Rollback always triggers a deployment (Phase 13) — send the user
      // straight to its live status rather than leaving them on this page.
      navigate(`/deployments/${result.deployment_id}`);
    },
  });

  const isCurrent = version.version === currentVersion;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium text-navy">v{version.version}</span>
        <Badge variant={VERSION_STATUS_VARIANT[version.version_status]}>
          {version.version_status}
        </Badge>
        {isCurrent ? <Badge variant="accent">current</Badge> : null}
        {version.rolled_back_from_version ? (
          <span className="text-xs text-muted-foreground">
            rolled back from v{version.rolled_back_from_version}
          </span>
        ) : null}
        <span className="ml-auto truncate text-sm text-muted-foreground">
          {version.change_description}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-3 px-4 pb-4">
          <div className="text-xs text-muted-foreground">
            {version.changed_by} · {new Date(version.created_at).toLocaleString()}
          </div>

          {diffLoading ? (
            <LoadingSpinner label="Loading diff…" />
          ) : diff ? (
            <VersionDiffViewer diff={diff} />
          ) : null}

          {canWrite && !isCurrent ? (
            <Button
              size="sm"
              variant="outline"
              disabled={rollbackMutation.isPending}
              onClick={() => {
                const reason = window.prompt(
                  `Reason for rolling back to v${version.version}?`,
                );
                if (reason) rollbackMutation.mutate(reason);
              }}
            >
              <RotateCcw size={14} />
              {rollbackMutation.isPending
                ? "Rolling back…"
                : `Rollback to v${version.version}`}
            </Button>
          ) : null}

          {rollbackMutation.isError ? (
            <p className="text-xs text-destructive">Rollback failed. Please try again.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function VersionTimeline({
  agentId,
  currentVersion,
  versions,
  canWrite,
}: VersionTimelineProps) {
  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {sorted.map((version) => (
        <VersionRow
          key={version.version}
          agentId={agentId}
          currentVersion={currentVersion}
          version={version}
          canWrite={canWrite}
        />
      ))}
    </div>
  );
}
