// Observability Settings (instructions_observability_UI.md, R45, CLAUDE.md
// Section 41.5).
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

// Grafana/Loki: endpoint-only, same reasoning as the generic OTel endpoint
// above — accepts spans over plain OTLP with no separate API key needed.
export interface GrafanaConfig {
  enabled: boolean;
  endpoint: string | null;
}

export interface SaveGrafanaRequest {
  enabled: boolean;
  endpoint?: string;
}

// New Relic: needs a license/API key, same masked-on-read shape as Datadog.
export interface NewRelicConfig {
  enabled: boolean;
  api_key: string | null;
}

export interface SaveNewRelicRequest {
  enabled: boolean;
  api_key?: string;
}

// Dynatrace: endpoint-only, same shape as Grafana/Loki.
export interface DynatraceConfig {
  enabled: boolean;
  endpoint: string | null;
}

export interface SaveDynatraceRequest {
  enabled: boolean;
  endpoint?: string;
}

export interface ObservabilityConfigResponse {
  default_stack: DefaultStackStatus;
  otel: OtelEndpointConfig;
  langfuse: LangfuseConfig;
  datadog: DatadogConfig;
  grafana: GrafanaConfig;
  new_relic: NewRelicConfig;
  dynatrace: DynatraceConfig;
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
