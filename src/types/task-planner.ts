// Task Planner — wizard Step 1 AI proposal (CLAUDE.md Section 38.6 Step 1 /
// 38.7).
//
// NOT YET IMPLEMENTED SERVER-SIDE — no /api/v1/platform/task-planner route
// found in the runtime. Shape below follows the proposal card layout given
// in 38.6 exactly (suggested name/persona/system prompt/tools/KB/guardrail/
// skills/output, each resource flagged in-catalog or not). "The Task
// Planner MUST NOT suggest resources that do not exist" (38.6) — this
// client trusts whatever `in_catalog`/`resource_id` the backend returns
// rather than re-deriving it, since only the backend can know the real
// catalog contents.

export interface CatalogSuggestion {
  name: string;
  description?: string;
  in_catalog: boolean;
  resource_id: string | null; // set only when in_catalog is true
}

export interface TaskPlannerProposal {
  suggested_name: string;
  suggested_description: string;
  suggested_agent_type: string;
  suggested_persona_name: string | null;
  suggested_system_prompt: string;
  suggested_tools: CatalogSuggestion[];
  suggested_knowledge_bases: CatalogSuggestion[];
  suggested_guardrail_policy: CatalogSuggestion | null;
  suggested_skills: CatalogSuggestion[];
  suggested_output_format: string | null;
}

export interface TaskPlannerAnalyzeRequest {
  description: string;
  project_id: string;
}
