import { httpClient } from "./http";
import type {
  ConnectorListResponse,
  ConnectorRecord,
  ConnectorTestRequest,
  ConnectorTestResult,
  CreateConnectorRequest,
} from "@/types/connector";

export async function listConnectors(): Promise<ConnectorListResponse> {
  const { data } = await httpClient.get<ConnectorListResponse>("/connectors");
  return data;
}

export async function getConnector(connectorId: string): Promise<ConnectorRecord> {
  const { data } = await httpClient.get<ConnectorRecord>(
    `/connectors/${connectorId}`,
  );
  return data;
}

export async function createConnector(
  request: CreateConnectorRequest,
): Promise<ConnectorRecord> {
  const { data } = await httpClient.post<ConnectorRecord>(
    "/connectors",
    request,
  );
  return data;
}

export async function testConnector(
  connectorId: string,
  request: ConnectorTestRequest,
): Promise<ConnectorTestResult> {
  const { data } = await httpClient.post<ConnectorTestResult>(
    `/connectors/${connectorId}/test`,
    request,
  );
  return data;
}
