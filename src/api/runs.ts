import { httpClient } from "./http";
import type {
  LogListResponse,
  RunListResponse,
  RunRecord,
  RunStatus,
  RunSummary,
  RunTrigger,
} from "@/types/runs";

export interface ListRunsParams {
  status_filter?: RunStatus;
  trigger?: RunTrigger;
  version?: number;
  limit?: number;
}

export async function listRuns(
  agentId: string,
  params: ListRunsParams = {},
): Promise<RunListResponse> {
  const { data } = await httpClient.get<RunListResponse>(`/agents/${agentId}/runs`, {
    params,
  });
  return data;
}

export async function getRun(agentId: string, runId: string): Promise<RunRecord> {
  const { data } = await httpClient.get<RunRecord>(`/agents/${agentId}/runs/${runId}`);
  return data;
}

// Observability — Runs Feature Phase 1: there is no real Generated Agent
// Runtime in this environment, so this is the only way to get run data to
// render. Gated server-side behind settings.seed_runs_enabled (403 when
// disabled) — never available in a real prototype/enterprise deployment.
export async function seedDemoRuns(agentId: string): Promise<RunListResponse> {
  const { data } = await httpClient.post<RunListResponse>(
    `/agents/${agentId}/runs/seed-demo`,
  );
  return data;
}

// Section 10 — Runs > All Runs header analytics.
export async function getRunsSummary(
  agentId: string,
  windowDays = 7,
): Promise<RunSummary> {
  const { data } = await httpClient.get<RunSummary>(`/agents/${agentId}/runs/summary`, {
    params: { window_days: windowDays },
  });
  return data;
}

// Section 8 — Logs tab.
export async function getRunLogs(agentId: string, runId: string): Promise<LogListResponse> {
  const { data } = await httpClient.get<LogListResponse>(
    `/agents/${agentId}/runs/${runId}/logs`,
  );
  return data;
}
