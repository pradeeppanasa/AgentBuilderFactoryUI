// Human-in-the-Loop review queue (CLAUDE.md Section 38.5 HitlConfig / 38.7).
//
// NOT YET IMPLEMENTED SERVER-SIDE — no panasa-hitl-reviews table or
// /api/v1/hitl routes found in the runtime. `context_summary` (never the
// full prompt/tool payload) follows R30/R14's "never prompt content, only
// summaries" rule already established for GuardrailDecision and
// OrchestrationExecutionRecord elsewhere in this spec.

export type HitlTrigger =
  | "always"
  | "low_confidence"
  | "tool_call"
  | "high_risk_decision";

export type HitlNotificationChannel = "email" | "slack" | "teams";
export type HitlTimeoutAction = "reject" | "approve";

export interface HitlConfig {
  trigger_on: HitlTrigger;
  confidence_threshold: number;
  reviewer_role: string;
  notification_channel: HitlNotificationChannel;
  timeout_hours: number;
  timeout_action: HitlTimeoutAction;
}

export function defaultHitlConfig(): HitlConfig {
  return {
    trigger_on: "low_confidence",
    confidence_threshold: 0.7,
    // QA finding U-06 (Wizard Redesign, 2026-08-18): pre-selecting a role
    // here (previously "admin") let a KYC/AML/fraud reviewer role go
    // unset by accident. Empty forces an explicit choice in Step 6.
    reviewer_role: "",
    notification_channel: "email",
    timeout_hours: 24,
    timeout_action: "reject",
  };
}

export type HitlReviewStatus = "pending" | "approved" | "rejected";

export interface HitlReviewRecord {
  review_id: string;
  agent_id: string;
  agent_name: string;
  tenant_id: string;
  reason: string;
  context_summary: string;
  status: HitlReviewStatus;
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface HitlReviewListResponse {
  items: HitlReviewRecord[];
}

export interface RejectHitlReviewRequest {
  reason: string;
}

export interface RequestInfoHitlReviewRequest {
  question: string;
}
