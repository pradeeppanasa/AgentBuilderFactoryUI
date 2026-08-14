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

export type AgentType =
  | "conversational"
  | "task"
  | "rag"
  | "multi-step"
  | "orchestrator";

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
}

// A minimal configuration payload accepted on create/update — the backend
// fills in defaults (guardrails, memory, output_format, etc.) for anything omitted.
export interface AgentConfigurationInput {
  model_id: string;
  model_provider: ModelProvider;
  system_prompt: string;
  temperature?: number;
  max_tokens?: number;
  fallback_model_string?: string | null;
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
}

export interface UpdateAgentRequest {
  configuration: AgentConfigurationInput;
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

export interface GenerateIaCResponse {
  agent_id: string;
  version: number;
  tool: string;
  iac_version: string;
  s3_key: string;
  modules: string[];
}
