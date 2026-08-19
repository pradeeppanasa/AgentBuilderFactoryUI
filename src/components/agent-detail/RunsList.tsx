import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FlaskConical } from "lucide-react";
import { getRunsSummary, listRuns, seedDemoRuns } from "@/api/runs";
import { Badge, Button, LoadingSpinner, Tabs } from "@/components/common";
import { ExecutionTimeline } from "@/components/agent-detail/ExecutionTimeline";
import { TraceTree } from "@/components/agent-detail/TraceTree";
import { LogsTab } from "@/components/agent-detail/LogsTab";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn, formatCostUsd, formatDuration, formatRelativeTime } from "@/lib/utils";
import type { ActivityLevel, RunRecord, RunStatus } from "@/types/runs";

// Phase 2, Section 5: Execution Timeline is now the primary run detail
// view; Activity Feed (Phase 1, Section 4) stays as a second tab for the
// same run rather than being replaced. Phase 3 adds Full Trace (Section 7,
// developer/admin only per the doc — "collapsed by default for
// non-developer roles") and Logs (Section 8) as a third/fourth tab.
const RUN_DETAIL_TABS = [
  { value: "timeline", label: "Execution Timeline" },
  { value: "activity", label: "Activity Feed" },
];
const DEVELOPER_RUN_DETAIL_TABS = [
  ...RUN_DETAIL_TABS,
  { value: "trace", label: "Full Trace" },
  { value: "logs", label: "Logs" },
];

const STATUS_VARIANT: Record<RunStatus, "success" | "destructive" | "warning" | "accent"> = {
  SUCCESS: "success",
  FAILED: "destructive",
  RUNNING: "accent",
  PARTIAL: "warning",
};

const STATUS_FILTERS: { value: RunStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "SUCCESS", label: "Successful" },
  { value: "FAILED", label: "Failed" },
  { value: "RUNNING", label: "Running" },
  { value: "PARTIAL", label: "Partial" },
];

const ACTIVITY_FILTERS: { value: ActivityLevel | "all"; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "INFO", label: "INFO" },
  { value: "WARNING", label: "WARNING" },
  { value: "ERROR", label: "ERROR" },
];

function ActivityFeed({ run }: { run: RunRecord }) {
  // Section 4: default INFO-and-above (WARNING/ERROR always visible), DEBUG
  // hidden unless explicitly toggled.
  const [levelFilter, setLevelFilter] = useState<ActivityLevel | "all">("all");
  const events = run.activity.filter((event) => {
    if (levelFilter !== "all") return event.level === levelFilter;
    return event.level !== "DEBUG";
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {ACTIVITY_FILTERS.map((f) => (
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
      <div className="space-y-1 rounded-md border border-border bg-muted/20 p-3 font-mono text-xs">
        {events.length === 0 ? (
          <p className="text-muted-foreground">No events at this level.</p>
        ) : (
          events.map((event, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="shrink-0 text-muted-foreground">
                {new Date(event.occurred_at).toLocaleTimeString()}
              </span>
              <span
                className={cn(
                  "shrink-0",
                  event.level === "ERROR"
                    ? "text-destructive"
                    : event.level === "WARNING"
                      ? "text-amber-700"
                      : "text-emerald-600",
                )}
              >
                {event.level === "ERROR" ? "✗" : event.level === "WARNING" ? "⚠" : "✓"}
              </span>
              <span className="text-navy">
                {event.message}
                {event.elapsed_ms !== null ? (
                  <span className="text-muted-foreground"> ({event.elapsed_ms}ms)</span>
                ) : null}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RunRow({ run, agentId }: { run: RunRecord; agentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState("timeline");
  const role = useAuthStore((state) => state.currentUser?.role);
  const isDeveloper = role === "developer" || role === "admin";
  const tabs = isDeveloper ? DEVELOPER_RUN_DETAIL_TABS : RUN_DETAIL_TABS;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="grid w-full grid-cols-[16px_1fr_1fr_1fr_100px_90px_70px_60px] items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/30"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-muted-foreground" title={new Date(run.started_at).toLocaleString()}>
          {formatRelativeTime(run.started_at)}
        </span>
        <span className="truncate font-mono text-xs text-navy">{run.run_id}</span>
        <span className="text-muted-foreground">
          {run.trigger === "SCHEDULER" && run.schedule_expression
            ? `Scheduler (${run.schedule_expression})`
            : run.trigger}
        </span>
        <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
        <span className="text-muted-foreground">{formatDuration(run.duration_ms)}</span>
        <span className="text-muted-foreground">{formatCostUsd(run.cost_usd)}</span>
        <span className="text-muted-foreground">v{run.version}</span>
      </button>

      {expanded ? (
        <div className="space-y-3 px-4 pb-4 pl-9">
          <div className="text-xs text-muted-foreground">
            Started {new Date(run.started_at).toLocaleString()}
            {run.duration_ms !== null ? ` · ${formatDuration(run.duration_ms)}` : ""}
            {run.cost_usd !== null ? ` · ${formatCostUsd(run.cost_usd)}` : ""} · v{run.version}
          </div>
          <Tabs tabs={tabs} value={detailTab} onChange={setDetailTab} />
          {detailTab === "timeline" ? <ExecutionTimeline run={run} /> : null}
          {detailTab === "activity" ? <ActivityFeed run={run} /> : null}
          {detailTab === "trace" ? <TraceTree run={run} /> : null}
          {detailTab === "logs" ? <LogsTab agentId={agentId} runId={run.run_id} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function RunsList({ agentId, canSeedDemo }: { agentId: string; canSeedDemo: boolean }) {
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["agents", agentId, "runs"],
    queryFn: () =>
      listRuns(agentId, statusFilter === "all" ? {} : { status_filter: statusFilter }),
  });

  // Section 10 — agent-level analytics header, last 7 days.
  const { data: summary } = useQuery({
    queryKey: ["agents", agentId, "runs", "summary"],
    queryFn: () => getRunsSummary(agentId, 7),
  });

  const seedMutation = useMutation({
    mutationFn: () => seedDemoRuns(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", agentId, "runs"] });
    },
  });

  const runs = data?.items ?? [];

  if (isLoading) {
    return <LoadingSpinner label="Loading runs…" />;
  }

  return (
    <div className="space-y-3">
      {summary && summary.total_runs > 0 ? (
        <div className="grid grid-cols-6 gap-3 rounded-lg border border-border bg-card p-3 text-xs">
          <p className="col-span-6 -mb-1 font-medium text-navy">Last {summary.window_days} days</p>
          <div>
            <p className="text-muted-foreground">Runs</p>
            <p className="font-mono text-navy">{summary.total_runs.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Success rate</p>
            <p className="font-mono text-navy">
              {summary.success_rate !== null ? `${Math.round(summary.success_rate * 100)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg latency</p>
            <p className="font-mono text-navy">{formatDuration(summary.avg_latency_ms)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Errors</p>
            <p className="font-mono text-navy">{summary.error_count.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total tokens</p>
            <p className="font-mono text-navy">{summary.total_tokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estimated cost</p>
            <p className="font-mono text-navy">{formatCostUsd(summary.estimated_cost_usd)}</p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-teal text-white"
                  : "bg-muted text-muted-foreground hover:text-navy",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {canSeedDemo ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={seedMutation.isPending}
              onClick={() => seedMutation.mutate()}
            >
              <FlaskConical size={13} />
              {seedMutation.isPending ? "Seeding…" : "Seed demo data"}
            </Button>
          </div>
        ) : null}
      </div>

      {seedMutation.isError ? (
        <p className="text-xs text-amber-800">
          {axiosErrorDetail(seedMutation.error) ?? "Demo data seeding is disabled on this deployment."}
        </p>
      ) : null}

      {runs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-navy">No runs recorded</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This agent has no run history yet. Deploy it to start receiving real traffic
            {canSeedDemo ? ", or seed demo data above to preview this screen." : "."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {runs.map((run) => (
            <RunRow key={run.run_id} run={run} agentId={agentId} />
          ))}
        </div>
      )}
    </div>
  );
}
