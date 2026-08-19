import { httpClient } from "./http";
import type {
  DatadogConfig,
  DynatraceConfig,
  GrafanaConfig,
  LangfuseConfig,
  NewRelicConfig,
  ObservabilityConfigResponse,
  OtelEndpointConfig,
  SaveDatadogRequest,
  SaveDynatraceRequest,
  SaveGrafanaRequest,
  SaveLangfuseRequest,
  SaveNewRelicRequest,
  SaveOtelEndpointRequest,
} from "@/types/observability";

export async function getObservabilityConfig(): Promise<ObservabilityConfigResponse> {
  const { data } = await httpClient.get<ObservabilityConfigResponse>(
    "/admin/settings/observability",
  );
  return data;
}

export async function saveOtelEndpoint(
  request: SaveOtelEndpointRequest,
): Promise<OtelEndpointConfig> {
  const { data } = await httpClient.patch<OtelEndpointConfig>(
    "/admin/settings/otel-endpoint",
    request,
  );
  return data;
}

export async function getLangfuseConfig(): Promise<LangfuseConfig> {
  const { data } = await httpClient.get<LangfuseConfig>(
    "/admin/settings/integrations/langfuse",
  );
  return data;
}

export async function saveLangfuseConfig(request: SaveLangfuseRequest): Promise<LangfuseConfig> {
  const { data } = await httpClient.patch<LangfuseConfig>(
    "/admin/settings/integrations/langfuse",
    request,
  );
  return data;
}

export async function getDatadogConfig(): Promise<DatadogConfig> {
  const { data } = await httpClient.get<DatadogConfig>(
    "/admin/settings/integrations/datadog",
  );
  return data;
}

export async function saveDatadogConfig(request: SaveDatadogRequest): Promise<DatadogConfig> {
  const { data } = await httpClient.patch<DatadogConfig>(
    "/admin/settings/integrations/datadog",
    request,
  );
  return data;
}

export async function getGrafanaConfig(): Promise<GrafanaConfig> {
  const { data } = await httpClient.get<GrafanaConfig>("/admin/settings/integrations/grafana");
  return data;
}

export async function saveGrafanaConfig(request: SaveGrafanaRequest): Promise<GrafanaConfig> {
  const { data } = await httpClient.patch<GrafanaConfig>(
    "/admin/settings/integrations/grafana",
    request,
  );
  return data;
}

export async function getNewRelicConfig(): Promise<NewRelicConfig> {
  const { data } = await httpClient.get<NewRelicConfig>(
    "/admin/settings/integrations/new-relic",
  );
  return data;
}

export async function saveNewRelicConfig(request: SaveNewRelicRequest): Promise<NewRelicConfig> {
  const { data } = await httpClient.patch<NewRelicConfig>(
    "/admin/settings/integrations/new-relic",
    request,
  );
  return data;
}

export async function getDynatraceConfig(): Promise<DynatraceConfig> {
  const { data } = await httpClient.get<DynatraceConfig>(
    "/admin/settings/integrations/dynatrace",
  );
  return data;
}

export async function saveDynatraceConfig(
  request: SaveDynatraceRequest,
): Promise<DynatraceConfig> {
  const { data } = await httpClient.patch<DynatraceConfig>(
    "/admin/settings/integrations/dynatrace",
    request,
  );
  return data;
}
