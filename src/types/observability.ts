// Observability Settings (instructions_observability_UI.md, R45).
//
// NOT YET IMPLEMENTED SERVER-SIDE — no /admin/settings/observability,
// /admin/settings/otel-endpoint, or /admin/settings/integrations/* routes
// found in panasa-agent-builder-runtime as of this writing. Shapes below
// follow the spec's API contract table exactly. Every call through
// api/observability.ts will 404 until the backend adds these routes.
//
// Role note: the spec's "Developer and Viewer roles receive 403" doesn't
// match this codebase's real role enum (types/auth.ts: admin | developer |
// analyst | auditor — there is no "viewer" role). Gating here uses the real
// enum: admin-only, same require_role() pattern as every other admin-only
// route already in the runtime.

export type ObservabilityComponentStatus = "active";

export interface DefaultStackStatus {
  cloudwatch: ObservabilityComponentStatus;
  xray: ObservabilityComponentStatus;
  otel_sdk: ObservabilityComponentStatus;
}

export interface OtelEndpointConfig {
  endpoint: string | null;
}

export interface SaveOtelEndpointRequest {
  endpoint: string;
}

export interface LangfuseConfig {
  enabled: boolean;
  public_key: string | null;
  // Secret Key: per spec, GET never returns the real value — "****" if
  // set, null if unset. Only ever WRITE this field on explicit Save.
  secret_key: string | null;
  host: string | null;
}

export interface SaveLangfuseRequest {
  enabled: boolean;
  public_key?: string;
  secret_key?: string;
  host?: string;
}

export type DatadogSite =
  | "datadoghq.com"
  | "datadoghq.eu"
  | "us3.datadoghq.com"
  | "us5.datadoghq.com";

export interface DatadogConfig {
  enabled: boolean;
  // API Key: same masked-on-read rule as Langfuse's secret_key.
  api_key: string | null;
  site: DatadogSite | null;
}

export interface SaveDatadogRequest {
  enabled: boolean;
  api_key?: string;
  site?: DatadogSite;
}

export interface ObservabilityConfigResponse {
  default_stack: DefaultStackStatus;
  otel: OtelEndpointConfig;
  langfuse: LangfuseConfig;
  datadog: DatadogConfig;
}

export const DATADOG_SITES: DatadogSite[] = [
  "datadoghq.com",
  "datadoghq.eu",
  "us3.datadoghq.com",
  "us5.datadoghq.com",
];

export function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}
