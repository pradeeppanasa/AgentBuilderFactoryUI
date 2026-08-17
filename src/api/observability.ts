import { httpClient } from "./http";
import type {
  DatadogConfig,
  LangfuseConfig,
  ObservabilityConfigResponse,
  OtelEndpointConfig,
  SaveDatadogRequest,
  SaveLangfuseRequest,
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
