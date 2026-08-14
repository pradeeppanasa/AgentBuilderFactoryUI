import { httpClient } from "./http";
import type {
  ModelCatalogResponse,
  PlatformHealth,
  PlatformUpgradeRecord,
  PlatformVersionInfo,
  TelemetryConfig,
  TelemetryConfigUpdateRequest,
  UpgradeRequest,
  UpgradeResponse,
} from "@/types/platform";

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const { data } = await httpClient.get<PlatformHealth>("/platform/health");
  return data;
}

export async function getModelCatalog(): Promise<ModelCatalogResponse> {
  const { data } = await httpClient.get<ModelCatalogResponse>(
    "/platform/models",
  );
  return data;
}

export async function getPlatformVersion(): Promise<PlatformVersionInfo> {
  const { data } = await httpClient.get<PlatformVersionInfo>(
    "/platform/version",
  );
  return data;
}

export async function triggerPlatformUpgrade(
  request: UpgradeRequest = {},
): Promise<UpgradeResponse> {
  const { data } = await httpClient.post<UpgradeResponse>(
    "/platform/upgrade",
    request,
  );
  return data;
}

export async function getPlatformUpgrade(
  upgradeId: string,
): Promise<PlatformUpgradeRecord> {
  const { data } = await httpClient.get<PlatformUpgradeRecord>(
    `/platform/upgrades/${upgradeId}`,
  );
  return data;
}

export async function getTelemetryConfig(): Promise<TelemetryConfig> {
  const { data } = await httpClient.get<TelemetryConfig>(
    "/platform/telemetry-config",
  );
  return data;
}

export async function updateTelemetryConfig(
  request: TelemetryConfigUpdateRequest,
): Promise<TelemetryConfig> {
  const { data } = await httpClient.put<TelemetryConfig>(
    "/platform/telemetry-config",
    request,
  );
  return data;
}
