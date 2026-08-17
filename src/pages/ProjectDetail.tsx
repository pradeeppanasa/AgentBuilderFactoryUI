import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { getProject } from "@/api/projects";
import { listAgents } from "@/api/agents";
import { Badge, Button, LoadingSpinner } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects", "detail", projectId],
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId),
  });

  // No project-scoped agents endpoint exists yet — filters the existing,
  // real /agents list client-side by project.agent_ids.
  const { data: agentsData } = useQuery({
    queryKey: ["agents", "list", "for-project"],
    queryFn: () => listAgents({ limit: 100 }),
    enabled: Boolean(project),
  });

  const projectAgents = (agentsData?.items ?? []).filter((a) =>
    project?.agent_ids.includes(a.agent_id),
  );

  if (isLoading) {
    return <LoadingSpinner label="Loading project…" />;
  }

  if (isError || !project) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Project not found or could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
        >
          <ArrowLeft size={14} />
          Projects
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-navy">{project.name}</h1>
              <Badge variant="secondary">{project.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          </div>
          {canWrite ? (
            <Link to={`/projects/${project.project_id}/agents/new`}>
              <Button variant="accent">
                <Plus size={16} />
                New Agent
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy">
          Agents ({projectAgents.length})
        </h2>
        {projectAgents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">No agents in this project yet.</p>
            {canWrite ? (
              <Link to={`/projects/${project.project_id}/agents/new`}>
                <Button variant="accent">
                  <Plus size={16} />
                  Create the first agent
                </Button>
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {projectAgents.map((agent) => (
              <Link
                key={agent.agent_id}
                to={`/agents/${agent.agent_id}`}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-teal/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-navy">{agent.name}</p>
                  <Badge variant="secondary">{agent.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {agent.agent_type} · v{agent.current_version}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
