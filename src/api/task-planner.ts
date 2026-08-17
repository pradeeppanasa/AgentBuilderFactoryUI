import { httpClient } from "./http";
import type { TaskPlannerAnalyzeRequest, TaskPlannerProposal } from "@/types/task-planner";

export async function analyzeTaskPlanner(
  request: TaskPlannerAnalyzeRequest,
): Promise<TaskPlannerProposal> {
  const { data } = await httpClient.post<TaskPlannerProposal>(
    "/platform/task-planner/analyze",
    request,
  );
  return data;
}
