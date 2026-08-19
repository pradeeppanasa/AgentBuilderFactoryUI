import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Check, Sparkles, Workflow, X } from "lucide-react";
import { analyzeTaskPlannerArchitecture } from "@/api/task-planner";
import { Badge, Button, LoadingSpinner, OptionCard } from "@/components/common";
import { axiosErrorDetail, cn } from "@/lib/utils";
import { ResourceSlideOver, type SlideOverKind } from "./ResourceSlideOver";
import type { CatalogSuggestion, TaskPlannerResponse } from "@/types/task-planner";
import type { WizardCreationMode, WizardDraft, WizardResourceSelection } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const MODE_OPTIONS: { value: WizardCreationMode; icon: typeof Bot; label: string; description: string }[] = [
  {
    value: "simple",
    icon: Bot,
    label: "Simple Agent",
    description:
      "Build one agent manually, step by step. Attach KBs, tools, skills, and guardrails as needed in Step 3.",
  },
  {
    value: "orchestrator",
    icon: Workflow,
    label: "Orchestrator Setup",
    description: "Build an orchestrator and define sub-agents manually. For known multi-agent architectures.",
  },
  {
    value: "build_with_ai",
    icon: Sparkles,
    label: "Build with AI",
    description:
      "Describe your goal in plain English. The platform proposes the full architecture — orchestrator, sub-agents, tools, KBs, skills, guardrails. You confirm. Next → Next → Next.",
  },
];

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
  proposal: TaskPlannerResponse | null;
  onProposal: (proposal: TaskPlannerResponse | null) => void;
  mode: WizardCreationMode;
  onModeChange: (mode: WizardCreationMode) => void;
  // Applies the accepted proposal to the draft and advances to Step 2.
  onAccept: () => void;
}

export function Step1Purpose({
  projectId,
  draft,
  onDraftChange,
  proposal,
  onProposal,
  mode,
  onModeChange,
  onAccept,
}: Step1PurposeProps) {
  const [description, setDescription] = useState(draft.description);
  const [slideOver, setSlideOver] = useState<SlideOverKind | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeTaskPlannerArchitecture({ description, project_id: projectId || null }),
    onSuccess: (result) => {
      onProposal(result);
      const isOrchestrator = result.sub_agents.length > 0 || result.orchestrator.agent_type === "orchestrator";
      onDraftChange({
        name: result.orchestrator.name,
        description: result.orchestrator.description,
        persona_name: result.orchestrator.persona_name,
        system_prompt: result.orchestrator.system_prompt,
        // Step 2 only ever offers Standard/Orchestrator — anything the
        // model suggested as "rag"/"tool_executor" comes down as
        // "standard" (those aren't roles, they're resource attachments).
        agent_type: isOrchestrator ? "orchestrator" : "standard",
      });
    },
  });

  function applySelection(
    field: "knowledge_bases" | "tools" | "skills",
    selection: WizardResourceSelection,
  ) {
    onDraftChange({ [field]: [...draft[field], selection] } as Partial<WizardDraft>);
  }

  function acceptProposal() {
    if (!proposal) return;
    const toSelection = (s: CatalogSuggestion): WizardResourceSelection | null =>
      s.in_catalog && s.resource_id ? { resource_id: s.resource_id, name: s.name } : null;

    onDraftChange({
      knowledge_bases: proposal.resources.knowledge_bases.map(toSelection).filter(Boolean) as WizardResourceSelection[],
      tools: proposal.resources.tools.map(toSelection).filter(Boolean) as WizardResourceSelection[],
      skills: proposal.resources.skills.map(toSelection).filter(Boolean) as WizardResourceSelection[],
      guardrail_policy: proposal.orchestrator.guardrail_policy
        ? toSelection(proposal.orchestrator.guardrail_policy)
        : null,
    });
    onAccept();
  }

  const hasSubAgents = (proposal?.sub_agents.length ?? 0) > 0;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Creation mode</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Choose how you want to build this agent. You can still edit anything manually
        afterwards, regardless of which mode you pick.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {MODE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            icon={option.icon}
            label={option.label}
            description={option.description}
            selected={mode === option.value}
            onClick={() => onModeChange(option.value)}
          />
        ))}
      </div>

      {mode === "simple" ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Continue to Step 2 to fill in the agent's identity, resources, and configuration
          manually.
        </p>
      ) : null}

      {mode === "orchestrator" ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Step 2's Agent role will be locked to Orchestrator. Add sub-agents in Step 3's
          Sub-agents section.
        </p>
      ) : null}

      {mode === "build_with_ai" ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-navy">Describe your goal</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The Task Planner analyses your existing catalog (tools, KBs, guardrails, skills,
            models) and proposes a full architecture — one agent, or an orchestrator with
            sub-agents — using only what already exists. It never invents a resource.
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
            {analyzeMutation.isPending ? (
              <LoadingSpinner label="Analysing your requirement and checking catalog…" />
            ) : null}
          </div>

          {analyzeMutation.isError ? (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {axiosErrorDetail(analyzeMutation.error) ??
                "Could not generate a proposal. You can continue manually."}
            </p>
          ) : null}

          {proposal ? (
            <div className="mt-5 space-y-4 rounded-lg border border-teal/30 bg-teal/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                Proposed architecture
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {hasSubAgents ? "Orchestrator" : "Proposed agent"}
                  </p>
                  <p className="font-medium text-navy">{proposal.orchestrator.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Persona</p>
                  <p className="font-medium text-navy">{proposal.orchestrator.persona_name ?? "—"}</p>
                </div>
              </div>

              {hasSubAgents ? (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Sub-agents</p>
                  <ul className="space-y-1">
                    {proposal.sub_agents.map((sub) => (
                      <li key={sub.name} className="rounded-md bg-background px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-navy">{sub.name}</span>
                        {sub.capability_description ? (
                          <span className="text-muted-foreground"> — {sub.capability_description}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Accepting creates the orchestrator now. Create each sub-agent separately
                    with this same wizard, then attach them in Step 3's Sub-agents section.
                  </p>
                </div>
              ) : null}

              <div>
                <p className="text-xs text-muted-foreground">System prompt (editable in Step 2)</p>
                <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md bg-background p-2 text-xs">
                  {proposal.orchestrator.system_prompt}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-navy">Resources</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-navy">Tools</p>
                    <div className="space-y-1.5">
                      {proposal.resources.tools.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None needed.</p>
                      ) : (
                        proposal.resources.tools.map((t) => (
                          <SuggestionRow key={t.name} suggestion={t} onCreate={() => setSlideOver("tool")} />
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-navy">Knowledge bases</p>
                    <div className="space-y-1.5">
                      {proposal.resources.knowledge_bases.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None needed.</p>
                      ) : (
                        proposal.resources.knowledge_bases.map((k) => (
                          <SuggestionRow
                            key={k.name}
                            suggestion={k}
                            onCreate={() => setSlideOver("knowledge_base")}
                          />
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-navy">Skills</p>
                    <div className="space-y-1.5">
                      {proposal.resources.skills.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None needed.</p>
                      ) : (
                        proposal.resources.skills.map((s) => (
                          <SuggestionRow key={s.name} suggestion={s} onCreate={() => setSlideOver("skill")} />
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-navy">Guardrail policy</p>
                    {proposal.orchestrator.guardrail_policy ? (
                      <SuggestionRow
                        suggestion={proposal.orchestrator.guardrail_policy}
                        onCreate={() => setSlideOver("guardrail_policy")}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">None suggested.</p>
                    )}
                  </div>
                </div>
              </div>

              {proposal.output_schema ? (
                <div>
                  <p className="text-xs text-muted-foreground">Output</p>
                  <p className="text-sm text-navy">{proposal.output_schema}</p>
                </div>
              ) : null}

              <p className="text-[11px] text-muted-foreground">
                Confidence {Math.round(proposal.confidence * 100)}%
                {proposal.reasoning ? ` — ${proposal.reasoning}` : ""}
              </p>

              <div className="flex items-center justify-between border-t border-teal/20 pt-3">
                <Button variant="ghost" size="sm" onClick={() => onProposal(null)}>
                  Edit proposal
                </Button>
                <Button variant="accent" onClick={acceptProposal}>
                  Accept &amp; Continue →
                </Button>
              </div>
            </div>
          ) : null}
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
