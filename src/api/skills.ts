import { httpClient } from "./http";
import type { CreateSkillRequest, Skill, SkillListResponse, UpdateSkillRequest } from "@/types/skill";

export async function listSkills(): Promise<SkillListResponse> {
  const { data } = await httpClient.get<SkillListResponse>("/platform/skills");
  return data;
}

export async function getSkill(skillId: string): Promise<Skill> {
  const { data } = await httpClient.get<Skill>(`/platform/skills/${skillId}`);
  return data;
}

export async function createSkill(request: CreateSkillRequest): Promise<Skill> {
  const { data } = await httpClient.post<Skill>("/platform/skills", request);
  return data;
}

export async function updateSkill(skillId: string, request: UpdateSkillRequest): Promise<Skill> {
  const { data } = await httpClient.put<Skill>(`/platform/skills/${skillId}`, request);
  return data;
}

export async function deleteSkill(skillId: string): Promise<void> {
  await httpClient.delete(`/platform/skills/${skillId}`);
}
