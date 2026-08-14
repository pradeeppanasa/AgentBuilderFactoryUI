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
