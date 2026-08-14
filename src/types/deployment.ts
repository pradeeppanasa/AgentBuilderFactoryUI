export const DEPLOYMENT_STAGE_ORDER = [
  "VALIDATING",
  "CHANGE_IMPACT",
  "GENERATING_IAC",
  "SECURITY_SCANNING",
  "EVALUATING",
  "TERRAFORM_VALIDATE",
  "TERRAFORM_PLAN",
  "POLICY_CHECK",
  "APPLYING",
  "DEPLOYING",
  "HEALTH_CHECK",
] as const;

export type DeploymentStageName = (typeof DEPLOYMENT_STAGE_ORDER)[number];

// Human-readable stage names, shared by StageTracker (per-stage rows on the
// deployment page) and DeploymentHistory (current stage per deployment on the
// agent page) so the two never drift apart.
export const DEPLOYMENT_STAGE_LABELS: Record<string, string> = {
  PENDING: "Pending",
  VALIDATING: "Validating",
  CHANGE_IMPACT: "Change Impact",
  GENERATING_IAC: "Generating IaC",
  SECURITY_SCANNING: "Security Scanning",
  EVALUATING: "Evaluating",
  TERRAFORM_VALIDATE: "Terraform Validate",
  TERRAFORM_PLAN: "Terraform Plan",
  POLICY_CHECK: "Policy Check",
  APPLYING: "Applying",
  DEPLOYING: "Deploying",
  HEALTH_CHECK: "Health Check",
  ACTIVE: "Active",
  FAILED: "Failed",
  BLOCKED: "Blocked",
};

export type DeploymentStatus = DeploymentStageName | "PENDING" | "ACTIVE" | "FAILED" | "BLOCKED";

export type StageStatus =
  | "PENDING"
  | "RUNNING"
  | "PASSED"
  | "FAILED"
  | "SKIPPED"
  | "BLOCKED";

export interface StageResult {
  stage: string;
  status: StageStatus;
  started_at: string | null;
  completed_at: string | null;
  output_summary: string | null;
  blocking_issue: string | null;
}

export interface DeploymentRecord {
  agent_id: string;
  deployment_id: string;
  version: number;
  triggered_by: string;
  triggered_at: string;

  status: DeploymentStatus;
  current_stage: string;

  stages: Record<string, StageResult>;

  terraform_plan_summary: string | null;
  terraform_apply_output: string | null;
  iac_s3_key: string | null;

  health_check_url: string | null;
  health_check_passed: boolean | null;

  failure_reason: string | null;
  failed_stage: string | null;

  updated_at: string;
}

export interface DeploymentListResponse {
  items: DeploymentRecord[];
}

export function isTerminalDeploymentStatus(status: DeploymentStatus): boolean {
  return status === "ACTIVE" || status === "FAILED" || status === "BLOCKED";
}
