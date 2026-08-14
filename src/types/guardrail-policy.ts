// Guardrail Policy Library (CLAUDE.md Section 37.7 / 37.10 / 37.11).
// Verified against the runtime's actual implementation
// (app/modules/guardrails/models.py, app/api/v1/guardrail_policies.py).
// Same delete-guard handling note as types/knowledge-base.ts — no
// `used_by_agent_ids` field; the referencing agents come back in the 409
// error detail at DELETE time.

export interface GuardrailPolicy {
  policy_id: string;
  tenant_id: string;
  name: string;
  description: string;

  input_enabled: boolean;

  bert_enabled: boolean;
  bert_model: string;
  bert_block_threshold: number;
  bert_escalate_threshold: number;

  bedrock_guardrail_id: string | null;
  bedrock_guardrail_version: string;

  output_enabled: boolean;
  output_pii_redaction: boolean;
  output_pii_entities: string[];
  output_topic_blocklist: string[];
  output_profanity_filter: boolean;
  output_max_tokens: number | null;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGuardrailPolicyRequest {
  name: string;
  description: string;
  input_enabled?: boolean;
  bert_enabled?: boolean;
  bert_block_threshold?: number;
  bert_escalate_threshold?: number;
  bedrock_guardrail_id?: string | null;
  output_enabled?: boolean;
  output_pii_redaction?: boolean;
  output_pii_entities?: string[];
  output_topic_blocklist?: string[];
  output_profanity_filter?: boolean;
  output_max_tokens?: number | null;
}

export type UpdateGuardrailPolicyRequest = Partial<CreateGuardrailPolicyRequest>;

export interface GuardrailPolicyListResponse {
  items: GuardrailPolicy[];
}

// Section 37.7 admin threshold constraints — enforced client-side too so
// a developer can't even attempt to submit a weaker threshold, matching
// "Security-critical settings ... cannot be weakened by users" (37.1).
export const BERT_BLOCK_THRESHOLD_MIN = 0.7;
export const BERT_ESCALATE_THRESHOLD_MAX = 0.6;
