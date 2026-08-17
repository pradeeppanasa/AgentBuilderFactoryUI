import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Sparkles, X } from "lucide-react";
import { analyzeTaskPlanner } from "@/api/task-planner";
import { Badge, Button, LoadingSpinner } from "@/components/common";
import { axiosErrorDetail, cn } from "@/lib/utils";
import { ResourceSlideOver, type SlideOverKind } from "./ResourceSlideOver";
import type { CatalogSuggestion, TaskPlannerProposal } from "@/types/task-planner";
import type { WizardDraft, WizardResourceSelection } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SuggestionRow({
  suggestion,
  onCreate,
}: {
  suggestion: CatalogSuggestion;
  onCreate: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        {suggestion.in_catalog ? (
          <Check size={14} className="text-emerald-600" />
        ) : (
          <X size={14} className="text-red-500" />
        )}
        <span className={suggestion.in_catalog ? "text-navy" : "text-muted-foreground"}>
          {suggestion.name}
        </span>
      </div>
      {!suggestion.in_catalog ? (
        <Button size="sm" variant="outline" onClick={onCreate}>
          Create
        </Button>
      ) : (
        <Badge variant="success">In catalog</Badge>
      )}
    </div>
  );
}

interface Step1PurposeProps {
  projectId: string;
  draft: WizardDraft;
  onDraftChange: (patch: Partial<WizardDraft>) => void;
  proposal: TaskPlannerProposal | null;
  onProposal: (proposal: TaskPlannerProposal) => void;
}

export function Step1Purpose({
  projectId,
  draft,
  onDraftChange,
  proposal,
  onProposal,
}: Step1PurposeProps) {
  const [description, setDescription] = useState(draft.description);
  const [slideOver, setSlideOver] = useState<SlideOverKind | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeTaskPlanner({ description, project_id: projectId }),
    onSuccess: (result) => {
      onProposal(result);
      onDraftChange({
        name: result.suggested_name,
        description: result.suggested_description,
        persona_name: result.suggested_persona_name,
        system_prompt: result.suggested_system_prompt,
      });
    },
  });

  function applySelection(
    field: "knowledge_bases" | "tools" | "skills",
    selection: WizardResourceSelection,
  ) {
    onDraftChange({ [field]: [...draft[field], selection] } as Partial<WizardDraft>);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-teal" />
        <h2 className="text-sm font-semibold text-navy">Purpose</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Describe what this agent should accomplish. The Task Planner analyses your catalog
        (tools, KBs, guardrails, skills, models) and proposes a starting configuration.
      </p>

      <textarea
        className={cn(inputClass, "mt-3 h-32 resize-y")}
        placeholder="For example: verify new UK business customers against Companies House and sanctions data."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="mt-3 flex items-center gap-3">
        <Button
          variant="accent"
          disabled={analyzeMutation.isPending || !description.trim()}
          onClick={() => analyzeMutation.mutate()}
        >
          {analyzeMutation.isPending ? "Analysing…" : "Analyse"}
        </Button>
        {analyzeMutation.isPending ? <LoadingSpinner label="Consulting the Task Planner…" /> : null}
      </div>

      {analyzeMutation.isError ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {axiosErrorDetail(analyzeMutation.error) ??
            "Task Planner is not available yet — POST /api/v1/platform/task-planner/analyze isn't implemented server-side. You can still fill in the rest of the wizard manually."}
        </p>
      ) : null}

      {proposal ? (
        <div className="mt-5 space-y-4 rounded-lg border border-teal/30 bg-teal/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            Proposal
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Suggested name</p>
              <p className="font-medium text-navy">{proposal.suggested_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suggested persona</p>
              <p className="font-medium text-navy">{proposal.suggested_persona_name ?? "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">System prompt (editable in Step 2)</p>
            <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md bg-background p-2 text-xs">
              {proposal.suggested_system_prompt}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-navy">Tools</p>
              <div className="space-y-1.5">
                {proposal.suggested_tools.map((t) => (
                  <SuggestionRow key={t.name} suggestion={t} onCreate={() => setSlideOver("tool")} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-navy">Knowledge bases</p>
              <div className="space-y-1.5">
                {proposal.suggested_knowledge_bases.map((k) => (
                  <SuggestionRow
                    key={k.name}
                    suggestion={k}
                    onCreate={() => setSlideOver("knowledge_base")}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-navy">Skills</p>
              <div className="space-y-1.5">
                {proposal.suggested_skills.map((s) => (
                  <SuggestionRow key={s.name} suggestion={s} onCreate={() => setSlideOver("skill")} />
                ))}
              </div>
            </div>
            {proposal.suggested_guardrail_policy ? (
              <div>
                <p className="mb-1.5 text-xs font-medium text-navy">Guardrail policy</p>
                <SuggestionRow
                  suggestion={proposal.suggested_guardrail_policy}
                  onCreate={() => setSlideOver("guardrail_policy")}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ResourceSlideOver
        kind={slideOver}
        onClose={() => setSlideOver(null)}
        onCreated={(selection) => {
          if (slideOver === "guardrail_policy") {
            onDraftChange({ guardrail_policy: selection });
          } else if (slideOver === "knowledge_base") {
            applySelection("knowledge_bases", selection);
          } else if (slideOver === "tool") {
            applySelection("tools", selection);
          } else if (slideOver === "skill") {
            applySelection("skills", selection);
          }
        }}
      />
    </section>
  );
}
