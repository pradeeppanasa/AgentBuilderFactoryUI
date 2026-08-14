import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { listAgents } from "@/api/agents";
import { Badge, Button, LoadingSpinner } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import type { AgentStatus } from "@/types/agent";

const STATUS_VARIANT: Record<
  AgentStatus,
  "success" | "warning" | "destructive" | "secondary" | "accent"
> = {
  DRAFT: "secondary",
  VALIDATING: "warning",
  TESTING: "warning",
  READY_FOR_APPROVAL: "warning",
  APPROVED: "accent",
  DEPLOYING: "accent",
  ACTIVE: "success",
  FAILED: "destructive",
  BLOCKED: "destructive",
  ROLLED_BACK: "warning",
  DEPRECATED: "secondary",
};

export default function AgentList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["agents", "list"],
    queryFn: () => listAgents(),
  });
  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `${data.items.length} agent${data.items.length === 1 ? "" : "s"}${
                  data.next_cursor ? " (more available)" : ""
                }`
              : ""}
          </p>
        </div>
        {canWrite ? (
          <Button asChild variant="accent">
            <Link to="/agents/new">
              <Plus size={16} />
              Create Agent
            </Link>
          </Button>
        ) : null}
      </div>

      {isLoading ? <LoadingSpinner label="Loading agents…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load agents. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No agents yet. Click "Create Agent" to get started.
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((agent) => (
                <tr key={agent.agent_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      to={`/agents/${agent.agent_id}`}
                      className="font-medium text-navy hover:text-teal"
                    >
                      {agent.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {agent.agent_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {agent.agent_type}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[agent.status]}>
                      {agent.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    v{agent.current_version}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(agent.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
