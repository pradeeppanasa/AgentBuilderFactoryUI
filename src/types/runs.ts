// Observability — Runs Feature (Phase 1 + Phase 2 + Phase 3). Mirrors
// app/modules/runs/models.py's RunRecord/ActivityEvent/RunStep/StepError/
// RagRetrievalDetail/Span/RunSummary/LogLine exactly.
//
// A Run is one execution of the *Generated Agent Runtime* serving real
// business traffic — distinct from a Playground session (never a
// production invocation) and from a Deployment (Terraform/deployment
// lifecycle, not agent execution).

export type RunStatus = "SUCCESS" | "FAILED" | "RUNNING" | "PARTIAL";
export type RunTrigger = "API" | "SCHEDULER" | "WEBHOOK" | "MANUAL" | "HITL";
export type ActivityLevel = "INFO" | "WARNING" | "ERROR" | "DEBUG";
export type StepStatus = "SUCCESS" | "FAILED" | "RUNNING";

export interface ActivityEvent {
  level: ActivityLevel;
  message: string;
  occurred_at: string;
  elapsed_ms: number | null;
}

// Section 6 — business-first error display. `business_reason` and
// `recommended_action` are shown by default; the rest is "Technical
// details", collapsed until expanded.
export interface StepError {
  business_reason: string;
  recommended_action: string;
  raw_error_code: string;
  request_id: string | null;
  trace_id: string | null;
  region: string | null;
  occurred_at: string;
}

// Section 9 — KB Retrieval panel. `query` is always the literal string
// "[REDACTED]" (R30).
export interface RagDocument {
  label: string;
  relevance: number;
}

export interface RagRetrievalDetail {
  query: string;
  documents_returned: number;
  relevant_count: number;
  relevance_threshold: number;
  retrieval_latency_ms: number;
  documents: RagDocument[];
}

export type RagasMetric =
  | "faithfulness"
  | "answer_relevance"
  | "context_precision"
  | "context_recall"
  | "context_relevance";

// Section 5 — one Execution Timeline (Gantt) row.
export interface RunStep {
  step_id: string;
  name: string;
  component: string;
  status: StepStatus;
  start_offset_ms: number;
  duration_ms: number | null;
  model_id: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  retry_count: number | null;
  error: StepError | null;
  rag: RagRetrievalDetail | null;
}

// Section 7 — Full Trace tab span tree node. `attributes` are scrubbed the
// same way as any other observability surface (R30/R45) — metadata only.
export interface Span {
  span_id: string;
  parent_span_id: string | null;
  name: string;
  start_offset_ms: number;
  duration_ms: number | null;
  status: StepStatus;
  attributes: Record<string, string>;
  tags: Record<string, string>;
}

export interface RunRecord {
  run_id: string;
  agent_id: string;
  tenant_id: string;
  version: number;
  status: RunStatus;
  trigger: RunTrigger;
  schedule_expression: string | null;
  started_at: string;
  duration_ms: number | null;
  cost_usd: number | null;
  activity: ActivityEvent[];
  steps: RunStep[];
  spans: Span[];
  ragas_scores: Partial<Record<RagasMetric, number>> | null;
}

export interface RunListResponse {
  items: RunRecord[];
}

// Section 10 — Runs > All Runs header analytics.
export interface RunSummary {
  window_days: number;
  total_runs: number;
  success_rate: number | null;
  avg_latency_ms: number | null;
  error_count: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

// Section 8 — Logs tab. See app/modules/runs/models.py's LogLine
// docstring: sourced from the Activity Feed in this environment, no real
// CloudWatch proxy exists yet.
export interface LogLine {
  timestamp: string;
  level: ActivityLevel;
  message: string;
}

export interface LogListResponse {
  lines: LogLine[];
}
