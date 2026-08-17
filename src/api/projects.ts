import { httpClient } from "./http";
import type {
  CreateProjectRequest,
  ProjectListResponse,
  ProjectRecord,
  UpdateProjectRequest,
} from "@/types/project";

export async function listProjects(): Promise<ProjectListResponse> {
  const { data } = await httpClient.get<ProjectListResponse>("/projects");
  return data;
}

export async function getProject(projectId: string): Promise<ProjectRecord> {
  const { data } = await httpClient.get<ProjectRecord>(`/projects/${projectId}`);
  return data;
}

export async function createProject(request: CreateProjectRequest): Promise<ProjectRecord> {
  const { data } = await httpClient.post<ProjectRecord>("/projects", request);
  return data;
}

export async function updateProject(
  projectId: string,
  request: UpdateProjectRequest,
): Promise<ProjectRecord> {
  const { data } = await httpClient.put<ProjectRecord>(`/projects/${projectId}`, request);
  return data;
}

export async function archiveProject(projectId: string): Promise<ProjectRecord> {
  return updateProject(projectId, { status: "archived" });
}

export async function restoreProject(projectId: string): Promise<ProjectRecord> {
  return updateProject(projectId, { status: "active" });
}

export async function deleteProject(projectId: string): Promise<void> {
  await httpClient.delete(`/projects/${projectId}`);
}
