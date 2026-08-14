export type ExecutorType = "http" | "lambda" | "sql" | "mcp";

export interface ConnectorRecord {
  tenant_id: string;
  connector_id: string;
  name: string;
  executor_type: ExecutorType;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  endpoint_template: string | null;
  credentials_required: string[];
  is_global: boolean;
  created_by: string;
  created_at: string;
}

export interface ConnectorListResponse {
  items: ConnectorRecord[];
}

export interface CreateConnectorRequest {
  name: string;
  executor_type: ExecutorType;
  description: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  endpoint_template?: string | null;
  credentials_required?: string[];
}

export interface ConnectorTestRequest {
  endpoint_params?: Record<string, string>;
  credentials?: Record<string, string>;
  test_payload?: Record<string, unknown> | null;
}

export interface ConnectorTestResult {
  success: boolean;
  status_code: number | null;
  summary: string;
}

// OpenAPI import (CLAUDE.md Section 37.6, Method B). Verified against the
// runtime's actual implementation (app/api/v1/connectors.py +
// tests/test_connectors_openapi_import_api.py) — there is no separate
// auth_method field; credentials_required is auto-detected server-side from
// the spec's securitySchemes.
export interface ImportOpenApiRequest {
  schema_document: Record<string, unknown> | string; // parsed JSON or a raw JSON/YAML string
}

export interface ImportOpenApiResponse {
  created: ConnectorRecord[]; // one per generated path/operation
}
