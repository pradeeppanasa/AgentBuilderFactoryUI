import { httpClient } from "./http";
import type {
  AgentDetailResponse,
  AgentListResponse,
  AgentStatus,
  AgentVersionRecord,
  CreateAgentRequest,
  CreateAgentResponse,
  DeleteAgentResponse,
  DeployResponse,
  GenerateIaCResponse,
  RollbackRequest,
  RollbackResponse,
  UpdateAgentRequest,
  UpdateAgentResponse,
  VersionDiffResponse,
  VersionListResponse,
} from "@/types/agent";
import type { DeploymentListResponse } from "@/types/deployment";
import type { PlaygroundRequest, PlaygroundResponse } from "@/types/playground";

export interface ListAgentsParams {
  status?: AgentStatus;
  cursor?: string;
  limit?: number;
}

export async function listAgents(
  params: ListAgentsParams = {},
): Promise<AgentListResponse> {
  const { data } = await httpClient.get<AgentListResponse>("/agents", {
    params,
  });
  return data;
}

export async function getAgent(agentId: string): Promise<AgentDetailResponse> {
  const { data } = await httpClient.get<AgentDetailResponse>(
    `/agents/${agentId}`,
  );
  return data;
}

export async function createAgent(
  request: CreateAgentRequest,
): Promise<CreateAgentResponse> {
  const { data } = await httpClient.post<CreateAgentResponse>(
    "/agents",
    request,
  );
  return data;
}

export async function updateAgent(
  agentId: string,
  request: UpdateAgentRequest,
): Promise<UpdateAgentResponse> {
  const { data } = await httpClient.put<UpdateAgentResponse>(
    `/agents/${agentId}`,
    request,
  );
  return data;
}

export async function deleteAgent(agentId: string): Promise<DeleteAgentResponse> {
  const { data } = await httpClient.delete<DeleteAgentResponse>(
    `/agents/${agentId}`,
  );
  return data;
}

export async function listVersions(agentId: string): Promise<VersionListResponse> {
  const { data } = await httpClient.get<VersionListResponse>(
    `/agents/${agentId}/versions`,
  );
  return data;
}

export async function getVersion(
  agentId: string,
  version: number,
): Promise<AgentVersionRecord> {
  const { data } = await httpClient.get<AgentVersionRecord>(
    `/agents/${agentId}/versions/${version}`,
  );
  return data;
}

export async function getVersionDiff(
  agentId: string,
  version: number,
): Promise<VersionDiffResponse> {
  const { data } = await httpClient.get<VersionDiffResponse>(
    `/agents/${agentId}/versions/${version}/diff`,
  );
  return data;
}

export async function rollbackAgent(
  agentId: string,
  request: RollbackRequest,
): Promise<RollbackResponse> {
  const { data } = await httpClient.post<RollbackResponse>(
    `/agents/${agentId}/rollback`,
    request,
  );
  return data;
}

export async function generateIac(agentId: string): Promise<GenerateIaCResponse> {
  const { data } = await httpClient.post<GenerateIaCResponse>(
    `/agents/${agentId}/generate-iac`,
  );
  return data;
}

export async function deployAgent(agentId: string): Promise<DeployResponse> {
  const { data } = await httpClient.post<DeployResponse>(
    `/agents/${agentId}/deploy`,
  );
  return data;
}

export async function listAgentDeployments(
  agentId: string,
): Promise<DeploymentListResponse> {
  const { data } = await httpClient.get<DeploymentListResponse>(
    `/agents/${agentId}/deployments`,
  );
  return data;
}

export async function invokePlayground(
  agentId: string,
  request: PlaygroundRequest,
): Promise<PlaygroundResponse> {
  const { data } = await httpClient.post<PlaygroundResponse>(
    `/agents/${agentId}/playground`,
    request,
  );
  return data;
}
