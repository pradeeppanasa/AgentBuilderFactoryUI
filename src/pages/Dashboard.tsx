import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bot, CheckCircle2 } from "lucide-react";
import { listAgents } from "@/api/agents";
import { getPlatformHealth } from "@/api/platform";
import { Badge, LoadingSpinner } from "@/components/common";
import { cn } from "@/lib/utils";
import type { ServiceHealth, ServiceStatus } from "@/types/platform";

const SERVICE_LABELS: Record<keyof ServiceHealth, string> = {
  database: "Database",
  cache: "Cache (Redis)",
  storage: "Storage",
  model_router: "Model Router",
  observability: "Observability",
};

function dotClassFor(status: ServiceStatus): string {
  if (status === "ok") return "bg-emerald-500";
  if (status === "disabled") return "bg-gray-400";
  if (status === "error") return "bg-red-500";
  return "bg-amber-500";
}

function ServiceDot({ label, status }: { label: string; status: ServiceStatus }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={cn("h-2.5 w-2.5 rounded-full", dotClassFor(status))}
        title={status}
      />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const {
    data: agentsData,
    isLoading: agentsLoading,
    isError: agentsError,
  } = useQuery({
    queryKey: ["agents", "list"],
    queryFn: () => listAgents(),
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["platform", "health"],
    queryFn: getPlatformHealth,
    retry: 0,
  });

  const agentCount = agentsData?.items.length ?? 0;
  const hasMoreAgents = Boolean(agentsData?.next_cursor);
  const activeCount =
    agentsData?.items.filter((a) => a.status === "ACTIVE").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your agent fleet and platform status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Agents
            </span>
            <Bot size={18} className="text-teal" />
          </div>
          <div className="mt-3 text-3xl font-semibold text-navy">
            {agentsLoading ? (
              <LoadingSpinner size={22} />
            ) : agentsError ? (
              "—"
            ) : (
              <>
                {agentCount}
                {hasMoreAgents ? (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    +
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Active Agents
            </span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-3 text-3xl font-semibold text-navy">
            {agentsLoading ? <LoadingSpinner size={22} /> : activeCount}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Platform Health
          </span>
          {health?.status === "ok" ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <AlertTriangle size={18} className="text-amber-500" />
          )}
        </div>

        {healthLoading ? (
          <div className="mt-3">
            <LoadingSpinner size={22} />
          </div>
        ) : health ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={health.status === "ok" ? "success" : "warning"}>
                {health.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                v{health.version} · {health.mode}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(Object.keys(SERVICE_LABELS) as Array<keyof ServiceHealth>).map(
                (key) => (
                  <ServiceDot
                    key={key}
                    label={SERVICE_LABELS[key]}
                    status={health.services[key]}
                  />
                ),
              )}
            </div>
          </>
        ) : (
          <div className="mt-3">
            <Badge variant="destructive">UNREACHABLE</Badge>
          </div>
        )}
      </div>

      {agentsError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not reach the Factory Runtime API. Verify VITE_API_URL and that
          the runtime is running.
        </div>
      ) : null}
    </div>
  );
}
