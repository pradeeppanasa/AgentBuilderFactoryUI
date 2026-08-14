// Playground (CLAUDE.md Section 37.9). Verified against the runtime's
// actual implementation (app/api/v1/playground.py + tests/test_playground_api.py).

export interface PlaygroundOverrides {
  disable_guardrails?: boolean; // admin only
  temperature?: number | null; // admin only
  clear_memory?: boolean; // admin only
}

export interface PlaygroundRequest {
  message: string;
  session_id?: string | null;
  overrides?: PlaygroundOverrides;
}

export interface PlaygroundLatencyBreakdown {
  guardrail_ms: number;
  retrieval_ms: number;
  llm_ms: number;
  total_ms: number;
}

export interface PlaygroundTokenUsage {
  input_tokens: number | null;
  output_tokens: number | null;
  kb_context_tokens: number | null;
  memory_context_tokens: number | null;
}

export interface PlaygroundGuardrailDecision {
  layer: "bert" | "bedrock" | "output";
  action: "block" | "escalate" | "pass";
  confidence: number | null;
}

export interface PlaygroundToolCall {
  name: string;
  duration_ms: number;
  success: boolean;
  cached: boolean;
}

export interface PlaygroundKBRetrieval {
  chunk_count: number;
  similarity_scores: number[];
}

export interface PlaygroundMemoryState {
  session_entries: number;
  long_term_entries_used: number;
}

export interface PlaygroundMetrics {
  latency: PlaygroundLatencyBreakdown;
  tokens: PlaygroundTokenUsage;
  estimated_cost_usd: number | null;
  guardrail_decisions: PlaygroundGuardrailDecision[];
  tool_calls: PlaygroundToolCall[];
  kb_retrievals: PlaygroundKBRetrieval | null;
  memory: PlaygroundMemoryState;
}

export interface PlaygroundResponse {
  session_id: string;
  blocked: boolean;
  message: string;
  metrics: PlaygroundMetrics;
}

export interface PlaygroundChatMessage {
  role: "user" | "assistant";
  content: string;
  blocked?: boolean;
  metrics?: PlaygroundMetrics;
}
