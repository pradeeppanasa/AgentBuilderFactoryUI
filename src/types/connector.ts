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
