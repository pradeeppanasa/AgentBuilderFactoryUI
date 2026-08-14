import { httpClient } from "./http";
import type { ModelCatalogResponse, PlatformHealth } from "@/types/platform";

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
