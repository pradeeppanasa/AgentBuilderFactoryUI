import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import { createSkill, deleteSkill, listSkills, updateSkill } from "@/api/skills";
import {
  ArchivedToggle,
  Badge,
  Button,
  LoadingSpinner,
  ResourceDeleteDialog,
} from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { useUndoToastStore } from "@/store/useUndoToastStore";
import { cn } from "@/lib/utils";
import type { CreateSkillRequest, Skill, SkillStatus } from "@/types/skill";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUS_VARIANT: Record<SkillStatus, "success" | "secondary" | "warning"> = {
  published: "success",
  draft: "secondary",
  deprecated: "warning",
};

function SkillCard({
  skill,
  canWrite,
  onDeleted,
}: {
  skill: Skill;
  canWrite: boolean;
  onDeleted: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const showUndoToast = useUndoToastStore((s) => s.show);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-navy">{skill.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{skill.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={STATUS_VARIANT[skill.status]}>{skill.status}</Badge>
          <Badge variant="outline">v{skill.version}</Badge>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{skill.capability}</p>

      {canWrite ? (
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" variant="destructive" onClick={() => setDialogOpen(true)}>
            Delete
          </Button>
        </div>
      ) : null}

      <ResourceDeleteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        resourceName={skill.name}
        resourceTypeLabel="skill"
        requireTypeToConfirm={skill.status === "published"}
        onArchive={async () => {
          // Skill's status enum has no literal "archived" value (Section
          // 38.3) — "deprecated" is the closest real analog: hidden from
          // active use, agents already pinned to this version keep working.
          await updateSkill(skill.skill_id, { status: "deprecated" });
          queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
          showUndoToast(`${skill.name} archived.`, async () => {
            await updateSkill(skill.skill_id, { status: "published" });
            queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
          });
        }}
        onPermanentDelete={async () => {
          await deleteSkill(skill.skill_id);
          onDeleted();
        }}
      />
    </div>
  );
}

export default function Skills() {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capability, setCapability] = useState("");
  const [promptFragment, setPromptFragment] = useState("");
  const [version, setVersion] = useState("1.0");

  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["skills", "list"],
    queryFn: listSkills,
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateSkillRequest) => createSkill(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
      setShowForm(false);
      setName("");
      setDescription("");
      setCapability("");
      setPromptFragment("");
      setVersion("1.0");
    },
  });

  const items = data?.items ?? [];
  const visible = items.filter((s) => (showArchived ? true : s.status !== "deprecated"));
  const archivedCount = items.filter((s) => s.status === "deprecated").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Skills Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable, versioned capabilities agents attach to via skill_ids — build the logic
            once, share it across every agent that needs it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ArchivedToggle
            showArchived={showArchived}
            onChange={setShowArchived}
            archivedCount={archivedCount}
          />
          {canWrite ? (
            <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
              <Plus size={16} />
              New Skill
            </Button>
          ) : null}
        </div>
      </div>

      {showForm ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name,
              description,
              capability,
              prompt_fragment: promptFragment,
              version,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-navy">Name</label>
              <input
                className={cn(inputClass, "mt-1")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Version</label>
              <input
                className={cn(inputClass, "mt-1")}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-navy">Description</label>
            <input
              className={cn(inputClass, "mt-1")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-navy">Capability</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Plain-English definition of what this skill does.
            </p>
            <input
              className={cn(inputClass, "mt-1")}
              value={capability}
              onChange={(e) => setCapability(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-navy">Prompt fragment</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Injected into the agent's system prompt when this skill is attached.
            </p>
            <textarea
              className={cn(inputClass, "mt-1 h-28 resize-y")}
              value={promptFragment}
              onChange={(e) => setPromptFragment(e.target.value)}
              required
            />
          </div>

          {createMutation.isError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Failed to create skill. Please try again.
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? <LoadingSpinner label="Loading skills…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load skills. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Sparkles size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No skills yet.</p>
          {canWrite ? (
            <Button variant="accent" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create your first Skill
            </Button>
          ) : null}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {visible.map((skill) => (
            <SkillCard
              key={skill.skill_id}
              skill={skill}
              canWrite={canWrite}
              onDeleted={() =>
                queryClient.invalidateQueries({ queryKey: ["skills", "list"] })
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
