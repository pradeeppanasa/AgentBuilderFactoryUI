// Projects (CLAUDE.md Section 38.2 / 38.7 / 38.8).
//
// NOT YET IMPLEMENTED SERVER-SIDE as of this writing — grep across
// panasa-agent-builder-runtime's app/ found no panasa-projects table, no
// ProjectRecord model, and no /api/v1/projects routes. Types below mirror
// Section 38.7/38.8's spec exactly (the only ground truth available); every
// call through api/projects.ts will 404 until the backend adds this. Built
// this way deliberately per explicit direction — ready to wire up the
// moment the backend lands, no UI rework expected since the shape is taken
// directly from the same spec the backend will implement against.

export type ProjectStatus = "active" | "paused" | "archived";

export interface ProjectRecord {
  project_id: string;
  tenant_id: string;
  name: string;
  description: string;
  owner_email: string;
  status: ProjectStatus;
  agent_ids: string[];
  tags: string[];
  guardrail_policy_id: string | null; // project-level default policy (38.2)
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  tags?: string[];
  guardrail_policy_id?: string | null;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest> & {
  status?: ProjectStatus;
};

export interface ProjectListResponse {
  items: ProjectRecord[];
}

// Section 38.11: DELETE on a project with agents returns 409 listing them.
export interface ReferencingAgent {
  type: "agent";
  id: string;
  name: string;
  project: string;
  status: string;
}
