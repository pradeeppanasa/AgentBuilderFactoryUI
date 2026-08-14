export type ServiceStatus = "ok" | "disabled" | "error" | string;

export interface ServiceHealth {
  database: ServiceStatus;
  cache: ServiceStatus;
  storage: ServiceStatus;
  model_router: ServiceStatus;
  observability: ServiceStatus;
}

export interface PlatformHealth {
  status: string;
  version: string;
  mode: "prototype" | "enterprise";
  services: ServiceHealth;
}

export type ModelProviderId = "bedrock" | "azure_openai" | "self_hosted";

export interface ModelInfo {
  model_id: string;
  model_provider: ModelProviderId;
  display_name: string;
  supports_knowledge_base: boolean;
}

export interface ModelCatalogResponse {
  models: ModelInfo[];
}

// ── Platform version / upgrade (Phase 15) ────────────────────────────────

export interface PlatformVersionInfo {
  platform_version: string;
  runtime_version: string;
  available_update: string | null;
  update_available: boolean;
}

export interface UpgradeRequest {
  target_version?: string | null;
}

export interface UpgradeResponse {
  upgrade_id: string;
  status: string;
  from_version: string;
  target_version: string;
  execution_arn: string;
}

export const UPGRADE_STAGE_ORDER = [
  "PULLING_IMAGE",
  "REGISTERING_TASK_DEFINITION",
  "UPDATING_SERVICE",
  "HEALTH_CHECK",
] as const;

export type UpgradeStageName = (typeof UPGRADE_STAGE_ORDER)[number];

// Human-readable labels for every value that can appear in either
// PlatformUpgradeRecord.status (the overall 6-state progression: PENDING →
// the 4 named stages → ACTIVE, plus the FAILED/ROLLED_BACK exception
// branches) or .stages{}'s keys — shared by UpgradeStageTracker and the
// status badge so the two never drift apart.
export const UPGRADE_STAGE_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PULLING_IMAGE: "Pulling Image",
  REGISTERING_TASK_DEFINITION: "Registering Task Definition",
  UPDATING_SERVICE: "Updating Service",
  HEALTH_CHECK: "Health Check",
  ACTIVE: "Active",
  FAILED: "Failed",
  ROLLED_BACK: "Rolled Back",
};

export type UpgradeStatus =
  | UpgradeStageName
  | "PENDING"
  | "ACTIVE"
  | "FAILED"
  | "ROLLED_BACK";

export type UpgradeStageStatus = "PENDING" | "RUNNING" | "PASSED" | "FAILED";

export interface UpgradeStageResult {
  stage: string;
  status: UpgradeStageStatus;
  started_at: string | null;
  completed_at: string | null;
  output_summary: string | null;
}

export interface PlatformUpgradeRecord {
  upgrade_id: string;

  from_version: string;
  target_version: string;
  target_image: string;

  previous_task_definition_arn: string | null;
  new_task_definition_arn: string | null;

  status: UpgradeStatus;
  current_stage: string;
  stages: Record<string, UpgradeStageResult>;

  triggered_by: string;
  triggered_at: string;

  failure_reason: string | null;
  failed_stage: string | null;

  updated_at: string;
}

export function isTerminalUpgradeStatus(status: UpgradeStatus): boolean {
  return status === "ACTIVE" || status === "FAILED" || status === "ROLLED_BACK";
}

// ── Telemetry config (Phase 16) ──────────────────────────────────────────

export type TelemetryCategory = "usage" | "performance" | "cost" | "errors";

export interface TelemetryCategoryToggles {
  usage: boolean;
  performance: boolean;
  cost: boolean;
  errors: boolean;
}

export interface TelemetryConfig {
  enabled: boolean;
  categories: TelemetryCategoryToggles;
}

// Mirrors the backend's TelemetryConfigUpdateRequest: `enabled` and
// `categories` are independently optional so a PUT can change just the
// master switch or just the category set without touching the other.
// categories itself is all-or-nothing on the backend (it replaces the
// whole TelemetryCategoryToggles object) — there's no per-category PATCH,
// so a single-category change must still send the full four-key object.
export interface TelemetryConfigUpdateRequest {
  enabled?: boolean | null;
  categories?: TelemetryCategoryToggles | null;
}
