// Skills — platform-wide reusable capability library (CLAUDE.md Section
// 38.3 / 38.7 / 38.8).
//
// NOT YET IMPLEMENTED SERVER-SIDE — no panasa-skills table, no Skill model,
// no /api/v1/platform/skills routes found in the runtime as of this
// writing. Types mirror Section 38.3's Pydantic model field-for-field.
// Distinct from the older, already-live SkillConfig in types/agent.ts
// (skill_id/enabled/config — a per-agent toggle for the 9 platform BUILT-IN
// skills like web_search/code_execution from Section 29). This Skill is a
// different concept: a versioned, admin-authored prompt capability, shared
// across agents via AgentConfiguration.skill_ids (Section 38.5).
import type { ReferencingAgent } from "./project";

export type SkillStatus = "draft" | "published" | "deprecated";

export interface Skill {
  skill_id: string;
  name: string;
  description: string;
  capability: string; // plain-English definition of what this skill does
  prompt_fragment: string; // injected into agent system prompt when attached
  input_schema: Record<string, unknown> | null;
  output_schema: Record<string, unknown> | null;
  version: string;
  status: SkillStatus;
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  capability: string;
  prompt_fragment: string;
  input_schema?: Record<string, unknown> | null;
  output_schema?: Record<string, unknown> | null;
  version?: string;
}

export type UpdateSkillRequest = Partial<CreateSkillRequest> & {
  status?: SkillStatus;
};

export interface SkillListResponse {
  items: Skill[];
}

export interface SkillDependencyError {
  detail: string;
  referenced_by: ReferencingAgent[];
}
