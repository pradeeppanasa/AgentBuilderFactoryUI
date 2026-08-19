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
  IaCStatusResponse,
  RollbackRequest,
  RollbackResponse,
  TerraformValidationMode,
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

export async function generateIac(
  agentId: string,
  validationMode: TerraformValidationMode = "local",
): Promise<GenerateIaCResponse> {
  const { data } = await httpClient.post<GenerateIaCResponse>(
    `/agents/${agentId}/generate-iac`,
    null,
    { params: { validation_mode: validationMode } },
  );
  return data;
}

export async function getIacStatus(agentId: string): Promise<IaCStatusResponse> {
  const { data } = await httpClient.get<IaCStatusResponse>(
    `/agents/${agentId}/iac/status`,
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
  // U-10: skips the real LLM/guardrail Bedrock calls server-side (A-02) —
  // useful wherever real provider credentials aren't available (e.g. this
  // IaC-test stage's local dev environment).
  mock = false,
): Promise<PlaygroundResponse> {
  const { data } = await httpClient.post<PlaygroundResponse>(
    `/agents/${agentId}/playground`,
    request,
    { params: mock ? { mock: true } : undefined },
  );
  return data;
}
