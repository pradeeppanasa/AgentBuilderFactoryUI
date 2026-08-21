import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { createAgent, getAgent, updateAgent } from "@/api/agents";
import { Badge, Button } from "@/components/common";
import { Link } from "react-router-dom";
import { axiosErrorDetail } from "@/lib/utils";
import { useNotifyStore } from "@/store/useNotifyStore";
import { WizardNav } from "@/components/agent-wizard-v2/WizardNav";
import { Step1Purpose } from "@/components/agent-wizard-v2/Step1Purpose";
import { Step2Identity } from "@/components/agent-wizard-v2/Step2Identity";
import { Step3Resources } from "@/components/agent-wizard-v2/Step3Resources";
import { Step4Intelligence } from "@/components/agent-wizard-v2/Step4Intelligence";
import { Step5Behaviour } from "@/components/agent-wizard-v2/Step5Behaviour";
import { Step6Orchestration } from "@/components/agent-wizard-v2/Step6Orchestration";
import { Step7HITL } from "@/components/agent-wizard-v2/Step7HITL";
import { Step7Review as Step8Review } from "@/components/agent-wizard-v2/Step7Review";
import { Step8Test as Step9Test } from "@/components/agent-wizard-v2/Step8Test";
import { Step9Publish as Step10Publish } from "@/components/agent-wizard-v2/Step9Publish";
import {
  WIZARD_TO_REAL_AGENT_TYPE,
  defaultWizardDraft,
  type WizardCreationMode,
  type WizardDraft,
} from "@/types/agent-wizard";
import { defaultHitlConfig, type HitlConfig } from "@/types/hitl";
import type { TaskPlannerResponse } from "@/types/task-planner";
import type {
  AgentConfiguration,
  CreateAgentRequest,
  ToolInstanceConfig,
} from "@/types/agent";

function toCreateAgentRequest(draft: WizardDraft): CreateAgentRequest {
  return {
    name: draft.name,
    // QA U-17 fix: business_purpose now has its own Step 2 field. Falls
    // back to description only if the user left it blank, so agents
    // created before this fix (and users who skip the optional field)
    // keep working the same as before.
    business_purpose: draft.business_purpose.trim() || draft.description,
    description: draft.description,
    agent_type: WIZARD_TO_REAL_AGENT_TYPE[draft.agent_type],
    // QA U-20/U-21: tags and the Step 10 Changelog were collected by the
    // wizard but never sent — create_agent() had no parameter for either,
    // so tags always saved as {} and v1's change_description was always
    // the hardcoded "Initial version" regardless of what the user typed.
    tags: Object.fromEntries(draft.tags.map((tag) => [tag, ""])),
    changelog: draft.changelog.trim() || null,
    configuration: {
      model_id: draft.model_id,
      model_provider: draft.model_provider,
      system_prompt: draft.system_prompt,
      temperature: draft.temperature,
      top_p: draft.top_p,
      max_tokens: draft.max_tokens,
      fallback_model_string: draft.fallback_model_string,
      // QA U-18 fix: every field below has a backend default, so it's
      // safe to send the wizard's resource selections on the initial
      // create call instead of a follow-up PUT (see saveMutation below —
      // that follow-up PUT unconditionally minted a new version, so every
      // wizard-created agent started at v2 instead of v1).
      kb_id: draft.knowledge_bases[0]?.resource_id ?? null,
      guardrail_policy_id: draft.guardrail_policy?.resource_id ?? null,
      tool_instances: draft.tools.map((t) => toolInstanceDefaults(t.resource_id)),
      output_schema: mapOutputFormat(draft.output_format, draft.output_json_schema),
    },
  };
}

function toolInstanceDefaults(connectorId: string): ToolInstanceConfig {
  return {
    connector_id: connectorId,
    timeout_ms: 10000,
    retry_count: 1,
    cache_enabled: false,
    cache_ttl_seconds: 300,
    error_handling: "fail_request",
    fallback_connector_id: null,
    parallel_calls_allowed: true,
  };
}

function mapOutputFormat(
  format: WizardDraft["output_format"],
  jsonSchemaText: string,
): AgentConfiguration["output_schema"] {
  if (format === "text") return null;
  // TS02-A-01: schema_definition was previously always null — the wizard
  // had no field to collect it, so the Playground's mock mode (which
  // shapes its fake reply from the agent's own output_schema) always fell
  // back to generic text. Best-effort parse: invalid/empty JSON silently
  // yields null rather than blocking the save — Step5Behaviour already
  // shows an inline "not valid JSON" warning for that case.
  let schemaDefinition: Record<string, unknown> | null = null;
  const trimmed = jsonSchemaText.trim();
  if (trimmed) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        schemaDefinition = parsed as Record<string, unknown>;
      }
    } catch {
      // Invalid JSON — leave schemaDefinition as null.
    }
  }
  return {
    // "structured" has no direct match in the existing OutputSchemaConfig
    // enum (none|json|xml|markdown) — treated as json, the closest
    // schema-validated option, until the backend adds a real structured type.
    format: format === "structured" ? "json" : format,
    schema_definition: schemaDefinition,
    strict_mode: true,
    max_retries: 2,
    fallback_on_max_retries: "return_error",
  };
}

export default function AgentWizard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [creationMode, setCreationMode] = useState<WizardCreationMode>("simple");
  const [draft, setDraft] = useState<WizardDraft>(defaultWizardDraft);
  const [hitlConfig, setHitlConfig] = useState<HitlConfig>(defaultHitlConfig);
  const [proposal, setProposal] = useState<TaskPlannerResponse | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // U-11: brief "Saved ✓" confirmation on the button itself, in addition to
  // the toast — cleared 2s after a successful save.
  const [justSaved, setJustSaved] = useState(false);
  const notify = useNotifyStore((s) => s.show);

  function patchDraft(patch: Partial<WizardDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function goToStep(next: number) {
    setCompletedSteps((prev) => new Set(prev).add(step));
    setStep(next);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!agentId) {
        // QA U-18 fix: toCreateAgentRequest now sends the resource
        // pickers (kb_id/guardrail_policy_id/tool_instances/output_schema)
        // directly on the create call — no more follow-up PUT, which
        // previously minted an unwanted second version (v2) before the
        // agent had even been edited once.
        const created = await createAgent(toCreateAgentRequest(draft));
        return created.agent_id;
      }
      const detail = await getAgent(agentId);
      await updateAgent(agentId, {
        change_description: draft.changelog || "Updated via Agent Wizard",
        configuration: {
          ...detail.configuration,
          kb_id: draft.knowledge_bases[0]?.resource_id ?? null,
          guardrail_policy_id: draft.guardrail_policy?.resource_id ?? null,
          tool_instances: draft.tools.map((t) => toolInstanceDefaults(t.resource_id)),
          output_schema: mapOutputFormat(draft.output_format, draft.output_json_schema),
        },
      });
      return agentId;
    },
    onSuccess: (id) => {
      setAgentId(id);
      setSaveError(null);
      setJustSaved(true);
      notify("Draft saved successfully", "success");
      window.setTimeout(() => setJustSaved(false), 2_000);
    },
    onError: (error) => {
      const message = axiosErrorDetail(error) ?? "Failed to save draft.";
      setSaveError(message);
      notify("Could not save draft — try again", "error");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={projectId ? `/projects/${projectId}` : "/projects"}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
          >
            <ArrowLeft size={14} />
            Back to project
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-navy">
            {draft.name || "New Agent"}
          </h1>
        </div>
        {/* U-11: status badge reflects the persisted agent, not the draft —
            it only appears once the first save has actually happened. */}
        {agentId ? <Badge variant="secondary">Draft</Badge> : null}
      </div>

      {saveError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {saveError}
        </div>
      ) : null}

      <div className="flex gap-6">
        <WizardNav activeStep={step} onSelect={setStep} completedSteps={completedSteps} />

        <div className="max-w-[720px] flex-1 space-y-5">
          {step === 1 ? (
            <Step1Purpose
              projectId={projectId ?? ""}
              draft={draft}
              onDraftChange={patchDraft}
              proposal={proposal}
              onProposal={setProposal}
              mode={creationMode}
              onModeChange={(nextMode) => {
                setCreationMode(nextMode);
                if (nextMode === "orchestrator") {
                  patchDraft({ agent_type: "orchestrator" });
                }
              }}
              onAccept={() => goToStep(2)}
            />
          ) : null}
          {step === 2 ? (
            <Step2Identity
              draft={draft}
              onChange={patchDraft}
              agentConfigurationLocked={creationMode === "orchestrator"}
            />
          ) : null}
          {step === 3 ? <Step3Resources draft={draft} onChange={patchDraft} /> : null}
          {step === 4 ? <Step4Intelligence draft={draft} onChange={patchDraft} /> : null}
          {step === 5 ? <Step5Behaviour draft={draft} onChange={patchDraft} /> : null}
          {step === 6 ? <Step6Orchestration draft={draft} onChange={patchDraft} /> : null}
          {step === 7 ? (
            <Step7HITL
              draft={draft}
              onChange={patchDraft}
              hitlConfig={hitlConfig}
              onHitlConfigChange={setHitlConfig}
            />
          ) : null}
          {step === 8 ? (
            <Step8Review
              draft={draft}
              onChange={patchDraft}
              hitlConfig={hitlConfig}
              proposal={proposal}
              creationMode={creationMode}
            />
          ) : null}
          {step === 9 ? (
            <Step9Test
              agentId={agentId}
              tested={draft.tested}
              onTestedChange={(tested) => patchDraft({ tested })}
            />
          ) : null}
          {step === 10 ? (
            <Step10Publish
              agentId={agentId}
              draft={draft}
              onChange={patchDraft}
              tested={draft.tested}
              onDeployed={(deploymentId) => navigate(`/deployments/${deploymentId}`)}
              onSaveDraft={() => saveMutation.mutateAsync()}
            />
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="ghost" disabled={step === 1} onClick={() => goToStep(step - 1)}>
              Back
            </Button>
            <div className="flex gap-2">
              {step === 8 ? (
                <Button
                  variant="outline"
                  disabled={saveMutation.isPending || !draft.name || !draft.system_prompt}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : justSaved ? (
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 size={14} />
                      Saved ✓
                    </span>
                  ) : (
                    "Save as draft"
                  )}
                </Button>
              ) : null}
              {step < 10 ? (
                <Button
                  variant="accent"
                  disabled={
                    step === 8 &&
                    (saveMutation.isPending || !draft.name || !draft.system_prompt)
                  }
                  onClick={async () => {
                    // I-03/U-11: Review's "Proceed to test" must persist the
                    // current draft first — otherwise Test/Publish (playground,
                    // generate-iac, deploy) can silently operate on
                    // whatever was last saved instead of what's on screen.
                    if (step === 8) {
                      try {
                        await saveMutation.mutateAsync();
                      } catch {
                        return; // error already surfaced via onError + toast
                      }
                    }
                    goToStep(step + 1);
                  }}
                >
                  {step === 8 && saveMutation.isPending ? "Saving…" : step === 8 ? "Proceed to test" : "Next"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
