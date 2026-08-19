import { httpClient } from "./http";
import type { TaskPlannerAnalyzeRequest, TaskPlannerResponse } from "@/types/task-planner";

export async function analyzeTaskPlannerArchitecture(
  request: TaskPlannerAnalyzeRequest,
): Promise<TaskPlannerResponse> {
  const { data } = await httpClient.post<TaskPlannerResponse>(
    "/platform/task-planner/analyze-architecture",
    request,
  );
  return data;
}
