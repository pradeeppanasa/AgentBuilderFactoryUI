// Guardrail Policy Library (CLAUDE.md Section 37.7 / 37.10 / 37.14 —
// 2026-08-16 rich-schema expansion).
//
// Mirrors app/modules/guardrails/models.py::GuardrailPolicy field-for-field
// (that Pydantic model is the source of truth for the GET/response shape;
// `extra="forbid"` there means every field below must exist server-side).
//
// NOTE: at the time this file was written, app/api/v1/guardrail_policies.py,
// app/modules/guardrails/store.py and the guardrail_policies_api tests were
// still on the OLDER flat schema (input_enabled/bert_model/bert_block_threshold/
// output_pii_redaction/...) — the backend session had updated models.py plus
// added a `create_bedrock_client` control-plane factory (referencing a not-yet-
// created `app.modules.guardrails.provisioner`) but had not yet migrated the
// route/store/tests to match. Create/Update request shapes below follow this
// codebase's established library-resource pattern (see CreateKnowledgeBaseRequest
// in api/v1/knowledge_bases.py: request mirrors the record 1:1, minus
// server-set id/tenant/timestamps/created_by fields) rather than the stale
// flat request currently in guardrail_policies.py. Re-verify against the real
// endpoint once that migration lands.

export type BedrockStrength = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export interface BertConfig {
  enabled: boolean;
  block_threshold: number;
  escalate_threshold: number;

  check_toxicity: boolean;
  check_nsfw: boolean;
  nsfw_threshold: number;
  nsfw_validation: "sentence" | "full_text";
  check_prompt_injection: boolean;
  prompt_injection_threshold: number;
  check_gibberish: boolean;
  gibberish_threshold: number;
  gibberish_validation: "sentence" | "full_text";
}

export interface BedrockFilterConfig {
  input_strength: BedrockStrength;
  output_strength: BedrockStrength;
}

export interface BedrockContentFilters {
  sexual_content: BedrockFilterConfig;
  violence: BedrockFilterConfig;
  hate_speech: BedrockFilterConfig;
  insults: BedrockFilterConfig;
  misconduct: BedrockFilterConfig;
  prompt_attack: BedrockFilterConfig;
}

export type PiiAction = "DISABLED" | "BLOCK" | "REDACT";

export interface PiiFieldConfig {
  action: PiiAction;
  applies_to: "input_output" | "input_only";
}

export interface PiiConfig {
  credit_card: PiiFieldConfig;
  email: PiiFieldConfig;
  phone: PiiFieldConfig;
  person_name: PiiFieldConfig;
  ssn: PiiFieldConfig;
  ip_address: PiiFieldConfig;
  api_key_secret: PiiFieldConfig;
  date_time: PiiFieldConfig;
}

export interface TopicConfig {
  banned_topics: string[];
  allowed_topics: string[] | null; // null = all allowed; list = whitelist
}

export type KeywordPatternType = "LITERAL" | "REGEX";
export type KeywordAction = "BLOCK" | "REDACT";

export interface KeywordRule {
  pattern: string;
  pattern_type: KeywordPatternType;
  action: KeywordAction;
}

export interface KeywordPolicy {
  rules: KeywordRule[];
}

export type ComplianceFramework =
  | "GDPR"
  | "HIPAA"
  | "PCI_DSS"
  | "MAS"
  | "SOC2"
  | "ISO_27001"
  | "EU_AI_ACT"
  | "CCPA"
  | "FEDRAMP";

export interface ComplianceConfig {
  frameworks: ComplianceFramework[];
  custom_rules: string[];
  on_violation: "stop_agent" | "flag_only";
}

export interface BlockedMessages {
  content_blocked: string;
  compliance_blocked: string;
}

export interface GuardrailPolicy {
  policy_id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;

  bert: BertConfig;

  bedrock_enabled: boolean;
  bedrock_credential_id: string | null;
  bedrock_guardrail_id: string | null; // auto-set by the API on save
  bedrock_guardrail_version: string; // auto-set by the API on save
  bedrock_content_filters: BedrockContentFilters;

  pii: PiiConfig;
  topics: TopicConfig;
  keywords: KeywordPolicy;
  compliance: ComplianceConfig;
  blocked_messages: BlockedMessages;
}

// Fields the client may set on create/update — everything server-controlled
// (policy_id/tenant_id/timestamps/created_by/bedrock_guardrail_id/
// bedrock_guardrail_version) is excluded, matching the CreateKnowledgeBaseRequest
// precedent elsewhere in this codebase.
export interface CreateGuardrailPolicyRequest {
  name: string;
  description: string;
  bert?: BertConfig;
  bedrock_enabled?: boolean;
  bedrock_credential_id?: string | null;
  bedrock_content_filters?: BedrockContentFilters;
  pii?: PiiConfig;
  topics?: TopicConfig;
  keywords?: KeywordPolicy;
  compliance?: ComplianceConfig;
  blocked_messages?: BlockedMessages;
}

export type UpdateGuardrailPolicyRequest = Partial<CreateGuardrailPolicyRequest>;

export interface GuardrailPolicyListResponse {
  items: GuardrailPolicy[];
}

// Section 37.7 admin threshold constraints — enforced client-side too so a
// developer can't even attempt to submit a weaker threshold ("Security-critical
// settings ... cannot be weakened by users", 37.1).
export const BERT_BLOCK_THRESHOLD_MIN = 0.7;
export const BERT_ESCALATE_THRESHOLD_MAX = 0.6;

export function defaultBertConfig(): BertConfig {
  return {
    enabled: true,
    block_threshold: 0.85,
    escalate_threshold: 0.4,
    check_toxicity: true,
    check_nsfw: true,
    nsfw_threshold: 0.8,
    nsfw_validation: "sentence",
    check_prompt_injection: true,
    prompt_injection_threshold: 0.3,
    check_gibberish: true,
    gibberish_threshold: 0.5,
    gibberish_validation: "sentence",
  };
}

function defaultFilter(outputStrength: BedrockStrength = "HIGH"): BedrockFilterConfig {
  return { input_strength: "HIGH", output_strength: outputStrength };
}

export function defaultBedrockContentFilters(): BedrockContentFilters {
  return {
    sexual_content: defaultFilter(),
    violence: defaultFilter(),
    hate_speech: defaultFilter(),
    insults: defaultFilter(),
    misconduct: defaultFilter(),
    // Prompt attacks are input-only — there is no "output" to classify.
    prompt_attack: defaultFilter("NONE"),
  };
}

function defaultPiiField(): PiiFieldConfig {
  return { action: "DISABLED", applies_to: "input_output" };
}

export function defaultPiiConfig(): PiiConfig {
  return {
    credit_card: defaultPiiField(),
    email: defaultPiiField(),
    phone: defaultPiiField(),
    person_name: defaultPiiField(),
    ssn: defaultPiiField(),
    ip_address: defaultPiiField(),
    api_key_secret: defaultPiiField(),
    date_time: defaultPiiField(),
  };
}

export function defaultTopicConfig(): TopicConfig {
  return { banned_topics: [], allowed_topics: null };
}

export function defaultKeywordPolicy(): KeywordPolicy {
  return { rules: [] };
}

export function defaultComplianceConfig(): ComplianceConfig {
  return { frameworks: [], custom_rules: [], on_violation: "stop_agent" };
}

export function defaultBlockedMessages(): BlockedMessages {
  return {
    content_blocked: "This content has been blocked by the content policy.",
    compliance_blocked: "This request cannot be processed due to compliance requirements.",
  };
}

// Client-side create-form suggestions only (37.14: "Default blocked keywords
// pre-loaded (admin can remove)") — the backend's KeywordPolicy.rules default
// is an empty list, so these are seeded into the CREATE form's local draft
// state, never assumed to already exist server-side.
export const DEFAULT_BLOCKED_KEYWORDS: string[] = [
  "jailbreak",
  "DAN mode",
  "developer mode",
  "system prompt",
  "ignore instructions",
  "override",
  "no restrictions",
  "act as",
];

export const PII_FIELD_LABELS: Record<keyof PiiConfig, string> = {
  credit_card: "Credit card numbers",
  email: "Email addresses",
  phone: "Phone numbers",
  person_name: "Names (person)",
  ssn: "SSN / National ID",
  ip_address: "IP addresses",
  api_key_secret: "API keys / tokens / JWTs",
  date_time: "Dates / times",
};

export const BEDROCK_FILTER_LABELS: Record<keyof BedrockContentFilters, string> = {
  sexual_content: "Sexual content",
  violence: "Violence",
  hate_speech: "Hate speech",
  insults: "Insults",
  misconduct: "Misconduct",
  prompt_attack: "Prompt attack",
};

export const COMPLIANCE_FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  GDPR: "GDPR",
  HIPAA: "HIPAA",
  PCI_DSS: "PCI DSS",
  MAS: "MAS",
  SOC2: "SOC 2",
  ISO_27001: "ISO 27001",
  EU_AI_ACT: "EU AI Act",
  CCPA: "CCPA",
  FEDRAMP: "FedRAMP",
};
