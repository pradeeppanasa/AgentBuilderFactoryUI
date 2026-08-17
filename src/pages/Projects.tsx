import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import { createProject, listProjects } from "@/api/projects";
import {
  ArchivedToggle,
  Badge,
  Button,
  LoadingSpinner,
  Modal,
} from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn } from "@/lib/utils";
import type { CreateProjectRequest, ProjectRecord, ProjectStatus } from "@/types/project";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUS_VARIANT: Record<ProjectStatus, "success" | "warning" | "secondary"> = {
  active: "success",
  paused: "warning",
  archived: "secondary",
};

function ProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <Link
      to={`/projects/${project.project_id}`}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-teal/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-navy">{project.name}</p>
        <Badge variant={STATUS_VARIANT[project.status]}>{project.status}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{project.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.agent_ids.length} agent{project.agent_ids.length === 1 ? "" : "s"}</span>
        <span>{project.owner_email}</span>
      </div>
    </Link>
  );
}

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["projects", "list"],
    queryFn: listProjects,
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateProjectRequest) => createProject(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      setShowForm(false);
      setName("");
      setDescription("");
      setFormError(null);
    },
    onError: (error) =>
      setFormError(axiosErrorDetail(error) ?? "Failed to create project."),
  });

  const items = data?.items ?? [];
  const visible = items.filter((p) => (showArchived ? true : p.status !== "archived"));
  const archivedCount = items.filter((p) => p.status === "archived").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group related agents under an orchestrator. Resources (tools, KBs, guardrails,
            skills) are always shared platform-wide — projects never own them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ArchivedToggle
            showArchived={showArchived}
            onChange={setShowArchived}
            archivedCount={archivedCount}
          />
          {canWrite ? (
            <Button variant="accent" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              New Project
            </Button>
          ) : null}
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={createMutation.isPending || !name || !description}
              onClick={() => createMutation.mutate({ name, description })}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-navy">Name</label>
            <input
              className={cn(inputClass, "mt-1")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Description</label>
            <textarea
              className={cn(inputClass, "mt-1 h-20 resize-y")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {formError ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {formError}
            </p>
          ) : null}
        </div>
      </Modal>

      {isLoading ? <LoadingSpinner label="Loading projects…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load projects. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <FolderKanban size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          {canWrite ? (
            <Button variant="accent" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create your first Project
            </Button>
          ) : null}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {visible.map((project) => (
            <ProjectCard key={project.project_id} project={project} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
