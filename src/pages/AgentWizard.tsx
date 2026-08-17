import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { createAgent, getAgent, updateAgent } from "@/api/agents";
import { Button } from "@/components/common";
import { Link } from "react-router-dom";
import { axiosErrorDetail } from "@/lib/utils";
import { WizardNav } from "@/components/agent-wizard-v2/WizardNav";
import { Step1Purpose } from "@/components/agent-wizard-v2/Step1Purpose";
import { Step2Identity } from "@/components/agent-wizard-v2/Step2Identity";
import { Step3Resources } from "@/components/agent-wizard-v2/Step3Resources";
import { Step4Intelligence } from "@/components/agent-wizard-v2/Step4Intelligence";
import { Step5Behaviour } from "@/components/agent-wizard-v2/Step5Behaviour";
import { Step6Orchestration } from "@/components/agent-wizard-v2/Step6Orchestration";
import { Step7Review } from "@/components/agent-wizard-v2/Step7Review";
import { Step8Test } from "@/components/agent-wizard-v2/Step8Test";
import { Step9Publish } from "@/components/agent-wizard-v2/Step9Publish";
import {
  WIZARD_TO_REAL_AGENT_TYPE,
  defaultWizardDraft,
  type WizardDraft,
} from "@/types/agent-wizard";
import { defaultHitlConfig, type HitlConfig } from "@/types/hitl";
import type { TaskPlannerProposal } from "@/types/task-planner";
import type {
  AgentConfiguration,
  CreateAgentRequest,
  ToolInstanceConfig,
} from "@/types/agent";

function toCreateAgentRequest(draft: WizardDraft): CreateAgentRequest {
  return {
    name: draft.name,
    // No dedicated business_purpose field in the wizard (Section 38.5 has
    // no such field either — it was folded into `description`) — reuses
    // description, matching how Step 1's Task Planner proposal treats them
    // as the same free-text statement of intent.
    business_purpose: draft.description,
    description: draft.description,
    agent_type: WIZARD_TO_REAL_AGENT_TYPE[draft.agent_type],
    configuration: {
      model_id: draft.model_id,
      model_provider: draft.model_provider,
      system_prompt: draft.system_prompt,
      temperature: draft.temperature,
      top_p: draft.top_p,
      max_tokens: draft.max_tokens,
      fallback_model_string: draft.fallback_model_string,
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

function mapOutputFormat(format: WizardDraft["output_format"]): AgentConfiguration["output_schema"] {
  if (format === "text") return null;
  return {
    // "structured" has no direct match in the existing OutputSchemaConfig
    // enum (none|json|xml|markdown) — treated as json, the closest
    // schema-validated option, until the backend adds a real structured type.
    format: format === "structured" ? "json" : format,
    schema_definition: null,
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
  const [draft, setDraft] = useState<WizardDraft>(defaultWizardDraft);
  const [hitlConfig, setHitlConfig] = useState<HitlConfig>(defaultHitlConfig);
  const [proposal, setProposal] = useState<TaskPlannerProposal | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        const created = await createAgent(toCreateAgentRequest(draft));
        // Attach the resource pickers (kb_id/guardrail_policy_id/
        // tool_instances) — CreateAgentRequest only accepts the minimal
        // AgentConfigurationInput, so this second call mirrors EditAgent's
        // own pattern: GET the default-filled config, patch it, PUT the
        // full object back.
        const detail = await getAgent(created.agent_id);
        await updateAgent(created.agent_id, {
          change_description: draft.changelog || "Created via Agent Wizard",
          configuration: {
            ...detail.configuration,
            kb_id: draft.knowledge_bases[0]?.resource_id ?? null,
            guardrail_policy_id: draft.guardrail_policy?.resource_id ?? null,
            tool_instances: draft.tools.map((t) => toolInstanceDefaults(t.resource_id)),
            output_schema: mapOutputFormat(draft.output_format),
          },
        });
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
          output_schema: mapOutputFormat(draft.output_format),
        },
      });
      return agentId;
    },
    onSuccess: (id) => {
      setAgentId(id);
      setSaveError(null);
    },
    onError: (error) => setSaveError(axiosErrorDetail(error) ?? "Failed to save draft."),
  });

  return (
    <div className="space-y-6">
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
            />
          ) : null}
          {step === 2 ? <Step2Identity draft={draft} onChange={patchDraft} /> : null}
          {step === 3 ? <Step3Resources draft={draft} onChange={patchDraft} /> : null}
          {step === 4 ? <Step4Intelligence draft={draft} onChange={patchDraft} /> : null}
          {step === 5 ? <Step5Behaviour draft={draft} onChange={patchDraft} /> : null}
          {step === 6 ? (
            <Step6Orchestration
              draft={draft}
              onChange={patchDraft}
              hitlConfig={hitlConfig}
              onHitlConfigChange={setHitlConfig}
            />
          ) : null}
          {step === 7 ? (
            <Step7Review draft={draft} hitlConfig={hitlConfig} proposal={proposal} />
          ) : null}
          {step === 8 ? (
            <Step8Test
              agentId={agentId}
              tested={draft.tested}
              onTestedChange={(tested) => patchDraft({ tested })}
            />
          ) : null}
          {step === 9 ? (
            <Step9Publish
              agentId={agentId}
              draft={draft}
              onChange={patchDraft}
              tested={draft.tested}
              onDeployed={(deploymentId) => navigate(`/deployments/${deploymentId}`)}
            />
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="ghost" disabled={step === 1} onClick={() => goToStep(step - 1)}>
              Back
            </Button>
            <div className="flex gap-2">
              {step === 7 ? (
                <Button
                  variant="outline"
                  disabled={saveMutation.isPending || !draft.name || !draft.system_prompt}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? "Saving…" : "Save as draft"}
                </Button>
              ) : null}
              {step < 9 ? (
                <Button variant="accent" onClick={() => goToStep(step + 1)}>
                  {step === 7 ? "Proceed to test" : "Next"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
