// Task Planner — wizard Step 1 "Build with AI" mode (CLAUDE.md Section 38.6
// Wizard Redesign round 2, Change 3).
//
// Calls the multi-agent architecture endpoint
// (POST /platform/task-planner/analyze-architecture -> TaskPlannerResponse),
// matched exactly against app/modules/task_planner/models.py. The backend
// also exposes an older single-agent endpoint (POST .../analyze ->
// TaskPlannerProposal) with its own passing test suite, kept alive
// server-side for that contract — nothing in this UI calls it anymore since
// the wizard now always treats Step 1's AI proposal as "one agent, zero or
// more sub-agents" rather than a single fixed shape.
//
// Catalog-bound by design: "The Task Planner MUST NOT suggest resources
// that do not exist" (Section 38.6) — this client trusts whatever
// `in_catalog`/`resource_id` the backend returns rather than re-deriving
// it, since only the backend can know the real catalog contents.

export interface CatalogSuggestion {
  name: string;
  description?: string | null;
  in_catalog: boolean;
  resource_id: string | null; // set only when in_catalog is true
}

// The real registry AgentType (app/modules/registry/models.py) — a
// proposed agent CAN come back as "rag"/"tool_executor" from the model,
// but the wizard's own Step 2 only ever offers Standard/Orchestrator (see
// types/agent-wizard.ts's WizardAgentType); anything else is mapped down
// to "standard" when a proposal is accepted, since RAG/Tool Executor are
// resource attachments, not a role the wizard lets you pick directly.
export type ProposalAgentType = "standard" | "orchestrator" | "rag" | "tool_executor";

export interface AgentProposal {
  name: string;
  description: string;
  agent_type: ProposalAgentType;
  persona_name: string | null;
  system_prompt: string;
  // Used by an orchestrator's LLM routing to decide which sub-agent to
  // delegate to — blank for a lone agent with no orchestrator role.
  capability_description: string;
  tools: CatalogSuggestion[];
  knowledge_bases: CatalogSuggestion[];
  guardrail_policy: CatalogSuggestion | null;
  skills: CatalogSuggestion[];
}

// Deduplicated union of every resource suggestion across the orchestrator
// and all sub-agents — one place to review everything the whole proposed
// architecture needs, independent of which specific agent uses what.
export interface ResourceProposal {
  tools: CatalogSuggestion[];
  knowledge_bases: CatalogSuggestion[];
  guardrail_policies: CatalogSuggestion[];
  skills: CatalogSuggestion[];
}

export interface TaskPlannerResponse {
  // For a simple, single-agent requirement, `orchestrator` holds the one
  // proposed agent (typically agent_type "standard") and `sub_agents` is
  // empty — there is no separate "single-agent" response shape.
  orchestrator: AgentProposal;
  sub_agents: AgentProposal[];
  resources: ResourceProposal;
  output_schema: string | null;
  confidence: number;
  reasoning: string;
}

export interface TaskPlannerAnalyzeRequest {
  description: string;
  project_id?: string | null;
}
