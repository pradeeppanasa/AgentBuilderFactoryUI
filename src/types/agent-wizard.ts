// 9-step Agent Wizard draft state (CLAUDE.md Section 38.5 / 38.6).
//
// Deliberately kept SEPARATE from types/agent.ts's real, already-working
// AgentConfiguration/CreateAgentRequest/UpdateAgentRequest. Section 38.5's
// full field set (persona, trigger, access, orchestration links, HITL,
// skill_ids, project_id, versioning/status) is NOT present anywhere in the
// runtime's actual AgentConfiguration Pydantic model — sending them on a
// real POST/PUT /agents call risks either silent data loss or a 422 from an
// `extra="forbid"` model we can't see the definition of. So the wizard
// collects ALL of Section 38.5's fields here as local draft state, then at
// Save/Publish time maps only the fields the real API already understands
// into a genuine CreateAgentRequest/UpdateAgentRequest (see
// pages/AgentWizard.tsx's `toCreateAgentRequest`). The rest round-trips
// nowhere yet — same "stored only, not yet enforced" disclosure pattern as
// guardrail policy Section 37.15, just one layer earlier (not even stored).

export type WizardAgentType =
  | "standard"
  | "orchestrator"
  | "task_planner"
  | "rag"
  | "tool_executor";

export type TriggerType = "on_demand" | "scheduled" | "webhook" | "step_function";

export interface TriggerConfig {
  type: TriggerType;
  cron_expression: string | null;
  webhook_secret: string | null;
}

export function defaultTriggerConfig(): TriggerConfig {
  return { type: "on_demand", cron_expression: null, webhook_secret: null };
}

export interface AccessConfig {
  invoke_roles: string[];
  rate_limit_rpm: number | null;
  rate_limit_rpd: number | null;
  monthly_budget_usd: number | null;
}

export function defaultAccessConfig(): AccessConfig {
  return {
    invoke_roles: ["admin", "developer", "viewer"],
    rate_limit_rpm: null,
    rate_limit_rpd: null,
    monthly_budget_usd: null,
  };
}

export type ExecutionMode = "sequential" | "parallel";

export interface WizardResourceSelection {
  resource_id: string;
  name: string;
  isNew?: boolean; // just created inline via the Step 1/3 slide-over
}

// The wizard's full local draft — a superset covering every Section 38.5
// field plus the resource pickers from Step 3.
export interface WizardDraft {
  // Step 2 — Identity & Persona
  name: string;
  description: string;
  agent_type: WizardAgentType;
  tags: string[];
  system_prompt: string;
  persona_name: string | null;
  greeting_message: string | null;
  response_tone: "formal" | "professional" | "casual";

  // Step 3 — Resources
  knowledge_bases: WizardResourceSelection[];
  tools: WizardResourceSelection[];
  skills: WizardResourceSelection[];
  guardrail_policy: WizardResourceSelection | null;

  // Step 4 — Intelligence
  model_id: string;
  model_provider: "bedrock" | "azure_openai" | "self_hosted";
  temperature: number;
  top_p: number;
  max_tokens: number;
  fallback_model_string: string | null;
  max_turns: number | null;
  session_timeout_minutes: number;

  // Step 5 — Behaviour
  trigger: TriggerConfig;
  output_format: "text" | "json" | "markdown" | "structured";
  access: AccessConfig;

  // Step 6 — Orchestration
  parent_orchestrator_id: string | null;
  sub_agent_ids: string[];
  execution_mode: ExecutionMode;
  hitl_enabled: boolean;

  // Step 8
  tested: boolean;

  // Step 9 — Publish
  version_label: string;
  changelog: string;
}

export function defaultWizardDraft(): WizardDraft {
  return {
    name: "",
    description: "",
    agent_type: "standard",
    tags: [],
    system_prompt: "",
    persona_name: null,
    greeting_message: null,
    response_tone: "professional",

    knowledge_bases: [],
    tools: [],
    skills: [],
    guardrail_policy: null,

    model_id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    model_provider: "bedrock",
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 2048,
    fallback_model_string: null,
    max_turns: null,
    session_timeout_minutes: 60,

    trigger: defaultTriggerConfig(),
    output_format: "text",
    access: defaultAccessConfig(),

    parent_orchestrator_id: null,
    sub_agent_ids: [],
    execution_mode: "sequential",
    hitl_enabled: false,

    tested: false,

    version_label: "1.0",
    changelog: "",
  };
}

// Maps a WizardAgentType to the real, already-live AgentType enum
// (types/agent.ts) — the closest existing runtime concept for each new
// wizard-only type, since the backend doesn't know these five values.
export const WIZARD_TO_REAL_AGENT_TYPE: Record<WizardAgentType, "conversational" | "task" | "rag" | "multi-step" | "orchestrator"> = {
  standard: "task",
  orchestrator: "orchestrator",
  task_planner: "task",
  rag: "rag",
  tool_executor: "task",
};

export const WIZARD_AGENT_TYPE_LABELS: Record<WizardAgentType, string> = {
  standard: "Standard",
  orchestrator: "Orchestrator",
  task_planner: "Task planner",
  rag: "RAG",
  tool_executor: "Tool executor",
};
