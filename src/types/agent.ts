export type AgentStatus =
  | "DRAFT"
  | "VALIDATING"
  | "TESTING"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "DEPLOYING"
  | "ACTIVE"
  | "FAILED"
  | "BLOCKED"
  | "ROLLED_BACK"
  | "DEPRECATED";

// Retired 2026-08-18 (CLAUDE.md Section 38.6 Wizard Redesign):
// "conversational"/"task" collapsed into "standard", "multi-step" collapsed
// into "orchestrator" — matches app/modules/registry/models.py's AgentType
// exactly. The backend Literal rejects the old values on new writes; only
// pre-existing DynamoDB records with an old value still read back fine via
// the backend's own normalise_agent_type() read-time shim.
export type AgentType = "standard" | "orchestrator" | "rag" | "tool_executor";

export type ModelProvider = "bedrock" | "azure_openai" | "self_hosted";

export interface GuardrailConfig {
  prompt_injection: boolean;
  pii_detection: boolean;
  toxicity_filter: boolean;
  topic_filter: boolean;
  blocked_topics: string[];
  hallucination_check: boolean;
  pii_strip_output: boolean;
}

export interface KBConfig {
  enabled: boolean;
  kb_name: string | null;
  s3_bucket: string | null;
  embedding_model: string;
  chunk_strategy: "semantic" | "fixed" | "paragraph";
  top_k: number;
  reranking_enabled: boolean;
}

export interface ToolConfig {
  tool_id: string;
  tool_name: string;
  executor_type: "http" | "lambda" | "sql" | "mcp" | "builtin";
  endpoint: string | null;
  lambda_arn: string | null;
  input_schema: Record<string, unknown>;
  credentials_secret_arn: string | null;
  connection_id: string | null;
}

export interface HumanReviewConfig {
  enabled: boolean;
  trigger_conditions: string[];
  notification_sns_arn: string | null;
  approval_timeout_hours: number;
}

export interface MemoryConfig {
  memory_type: "none" | "session" | "persistent";
  persistent_memory_ttl_days: number;
  max_session_turns: number;
}

export interface OutputFormatConfig {
  format_type: "text" | "json" | "markdown" | "structured";
  json_schema: Record<string, unknown> | null;
  output_instructions: string | null;
}

export interface SubAgentRef {
  agent_id: string;
  agent_name: string;
  capability_description: string;
  allowed_actions: string[];
}

export interface OrchestrationConfig {
  is_manager: boolean;
  routing_strategy: "llm" | "rules" | "round_robin" | "broadcast" | "pipeline";
  sub_agents: SubAgentRef[];
  fallback_agent_id: string | null;
  max_delegation_depth: number;
}

export interface MCPServerConfig {
  server_id: string;
  server_name: string;
  transport: "sse" | "http" | "stdio";
  endpoint: string;
  credentials_secret_arn: string | null;
  tool_filter: string[];
}

export interface SkillConfig {
  skill_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AgentConfiguration {
  model_id: string;
  model_provider: ModelProvider;
  temperature: number;
  max_tokens: number;
  top_p: number;
  context_window_k: number;
  fallback_model_string: string | null;

  system_prompt: string;
  system_prompt_variables: string[];
  prompt_version: string | null;

  guardrails: GuardrailConfig;
  policies: string[];
  knowledge_base: KBConfig | null;
  tools: ToolConfig[];
  human_review: HumanReviewConfig | null;

  token_budget_daily: number | null;
  rate_limit_rpm: number | null;

  observability_enabled: boolean;
  langfuse_enabled: boolean;
  audit_enabled: boolean;
  audit_s3_prefix: string | null;

  memory: MemoryConfig;
  output_format: OutputFormatConfig;
  orchestration: OrchestrationConfig | null;
  mcp_servers: MCPServerConfig[];
  skills: SkillConfig[];

  // Advanced Config (CLAUDE.md Section 37.11) — additive fields the backend
  // added alongside the older ones above (app/modules/registry/models.py's
  // own comment: "additive, not replacing"). kb_id/guardrail_policy_id are
  // the ones the UI actively sets (EditAgent's catalog pickers); the other
  // four round-trip transparently on save without dedicated UI yet.
  kb_id: string | null;
  guardrail_policy_id: string | null;
  model_advanced: ModelAdvancedConfig | null;
  memory_config: MemoryAdvancedConfig | null;
  tool_instances: ToolInstanceConfig[];
  output_schema: OutputSchemaConfig | null;
}

export interface ModelAdvancedConfig {
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  stop_sequences: string[];
  request_timeout_ms: number;
  retry_count: number;
  streaming: boolean;
  conversation_history_turns: number;
  max_context_tokens: number;
  fallback_model_string: string | null;
  cost_budget_usd: number | null;
  latency_budget_ms: number | null;
}

// Named MemoryAdvancedConfig on the frontend too, matching the backend's
// own rename (app/modules/registry/models.py) — kept distinct from the
// existing MemoryConfig above (memory_type/persistent_memory_ttl_days/
// max_session_turns), a different, already-in-use shape.
export interface MemoryAdvancedConfig {
  session_enabled: boolean;
  session_ttl_minutes: number;
  long_term_enabled: boolean;
  long_term_max_entries: number;
  long_term_retrieval_top_k: number;
  summary_enabled: boolean;
  summary_trigger_turns: number;
  summary_model: string | null;
}

export interface ToolInstanceConfig {
  connector_id: string;
  timeout_ms: number;
  retry_count: number;
  cache_enabled: boolean;
  cache_ttl_seconds: number;
  error_handling: "fail_request" | "skip_tool" | "use_fallback";
  fallback_connector_id: string | null;
  parallel_calls_allowed: boolean;
}

export interface OutputSchemaConfig {
  format: "none" | "json" | "xml" | "markdown";
  schema_definition: Record<string, unknown> | null;
  strict_mode: boolean;
  max_retries: number;
  fallback_on_max_retries: "return_raw" | "return_error";
}

// A minimal configuration payload accepted on create/update — the backend
// fills in defaults (guardrails, memory, output_format, etc.) for anything omitted.
export interface AgentConfigurationInput {
  model_id: string;
  model_provider: ModelProvider;
  system_prompt: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  fallback_model_string?: string | null;
  // QA U-18 fix: every field below has a Python default on the backend's
  // AgentConfiguration model (registry/models.py), so POST /agents can
  // carry the wizard's resource selections directly. Previously the
  // wizard always followed create with a second PUT just to attach these
  // — that PUT unconditionally creates a new version (versioner.py), so
  // every wizard-created agent started at v2 instead of v1.
  kb_id?: string | null;
  guardrail_policy_id?: string | null;
  tool_instances?: ToolInstanceConfig[];
  output_schema?: OutputSchemaConfig | null;
}

export type VersionStatus =
  | "DRAFT"
  | "TESTING"
  | "BLOCKED"
  | "LIVE"
  | "SUPERSEDED"
  | "ROLLED_BACK";

export interface AgentRecord {
  tenant_id: string;
  agent_id: string;
  name: string;
  description: string;
  business_purpose: string;
  agent_type: AgentType;
  current_version: number;
  live_version: number | null;
  status: AgentStatus;
  platform_version: string;
  runtime_version: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  tags: Record<string, string>;
}

export interface AgentSecurityPolicy {
  guardrail_profile: "standard" | "strict" | "pii_safe" | "financial" | "custom";
  pii_policy: "block" | "redact" | "allow";
  data_classification: "public" | "internal" | "confidential" | "restricted";
}

export interface AgentCapabilityContract {
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  version: number;
  description: string;
  capabilities: string[];
  accepted_input_schema: Record<string, unknown> | null;
  output_schema: Record<string, unknown> | null;
  skills: string[];
  tools: string[];
  mcp_servers: string[];
  knowledge_bases: string[];
  allowed_actions: string[];
  restricted_actions: string[];
  security_policy: AgentSecurityPolicy;
  latency_sla_ms: number | null;
  token_budget: number | null;
}

export interface AgentListResponse {
  items: AgentRecord[];
  next_cursor: string | null;
}

export interface AgentDetailResponse {
  agent: AgentRecord;
  configuration: AgentConfiguration;
  capability_contract: AgentCapabilityContract;
}

export interface CreateAgentResponse {
  agent_id: string;
  version: number;
  status: AgentStatus;
  created_at: string;
}

export interface UpdateAgentResponse {
  agent_id: string;
  version: number;
  status: AgentStatus;
  updated_at: string;
}

export interface DeleteAgentResponse {
  agent_id: string;
  status: AgentStatus;
  updated_at: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  business_purpose: string;
  agent_type: AgentType;
  configuration: AgentConfigurationInput;
  tags?: Record<string, string>;
  // QA U-21: v1's change_description was previously always the hardcoded
  // "Initial version" string, discarding whatever the wizard's Step 10
  // Changelog field said. Optional — omitting it keeps the old behaviour.
  changelog?: string | null;
}

// The backend's PUT /agents/{id} accepts the FULL AgentConfiguration (not
// the reduced AgentConfigurationInput CreateAgent sends) — confirmed
// against app/api/v1/agents.py's UpdateAgentRequest Pydantic model, which
// types `configuration` as AgentConfiguration. EditAgent.tsx always starts
// from the current full config (via GET) and PUTs back the complete
// object, so there's no need to know which backend fields have Python
// defaults — every required field is already populated.
export interface UpdateAgentRequest {
  configuration: AgentConfiguration;
  change_description: string;
}

export interface AgentVersionSummary {
  version: number;
  version_status: VersionStatus;
  change_description: string;
  changed_by: string;
  created_at: string;
  deployment_result: "SUCCESS" | "FAILED" | "BLOCKED" | null;
  rolled_back_from_version: number | null;
}

export interface VersionListResponse {
  items: AgentVersionSummary[];
}

export interface AgentVersionRecord {
  agent_id: string;
  version: number;
  version_status: VersionStatus;
  change_description: string;
  changed_by: string;
  created_at: string;
  configuration: AgentConfiguration;
  capability_contract: AgentCapabilityContract;
  iac_version: string | null;
  iac_s3_key: string | null;
  deployment_id: string | null;
  terraform_plan_summary: string | null;
  deployment_result: "SUCCESS" | "FAILED" | "BLOCKED" | null;
  rolled_back_from_version: number | null;
}

export interface ChangedField {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AddedField {
  field: string;
  value: unknown;
}

export interface RemovedField {
  field: string;
  value: unknown;
}

export interface ConfigDiff {
  changed: ChangedField[];
  added: AddedField[];
  removed: RemovedField[];
}

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ImpactAnalysis {
  impact_level: ImpactLevel;
  required_validations: string[];
  matched_rules: string[];
}

export interface VersionDiffResponse {
  agent_id: string;
  from_version: number | null;
  to_version: number;
  config_diff: ConfigDiff;
  impact_analysis: ImpactAnalysis;
}

export interface RollbackRequest {
  target_version: number;
  reason: string;
}

export interface RollbackResponse {
  agent_id: string;
  version: number;
  status: AgentStatus;
  rolled_back_from_version: number;
  updated_at: string;
  deployment_id: string;
  branch: string;
  pull_request_id: string;
}

export interface DeployResponse {
  agent_id: string;
  version: number;
  deployment_id: string;
  status: AgentStatus;
  branch: string;
  pull_request_id: string;
}

// Development Terraform Validation Mode. "local" (default) always runs and
// never requires AWS credentials or contacts a real AWS account — it only
// generates the Terraform package and runs fmt/init -backend=false/validate.
// "panasa_vpc"/"customer_vpc" are admin/developer-only placeholders for
// later stages (Section 35 Stage 2/3): hidden from every other role, and
// even when selected they still only run the same local validation —
// no real deployment happens in Stage 1 (backend returns `environment_note`
// explaining this).
export type TerraformValidationMode = "local" | "panasa_vpc" | "customer_vpc";

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface IaCValidationReport {
  passed: boolean;
  checks: CheckResult[];
  tool: string;
}

export interface GenerateIaCResponse {
  agent_id: string;
  version: number;
  tool: string;
  iac_version: string;
  s3_key: string;
  modules: string[];
  validation_report: IaCValidationReport;
  validation_mode: TerraformValidationMode;
  environment_note: string | null;
}

// GET /agents/{agent_id}/iac/status (Wizard Redesign QA A-04/U-08).
// generate-iac renders + validates synchronously in a single request (no
// long-running job to observe mid-flight) — this reports the outcome of the
// most recent completed generate-iac call, not a live in-progress state. A
// caller that polls right after triggering generate-iac sees
// "completed"/"failed" on its first poll.
export interface IaCStageStatus {
  name: string;
  status: "completed" | "pending";
}

export interface IaCStatusResponse {
  agent_id: string;
  version: number;
  status: "not_started" | "completed" | "failed";
  stages: IaCStageStatus[];
  validation: IaCValidationReport | null;
}
