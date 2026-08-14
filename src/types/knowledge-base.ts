// Knowledge Base Library (CLAUDE.md Section 37.5 / 37.10 / 37.11). Verified
// against the runtime's actual implementation
// (app/modules/knowledge_base/models.py, app/api/v1/knowledge_bases.py).
//
// There is no `used_by_agent_ids` field on the record itself — the
// delete-guard check (Section 37.10: "blocked if any agent references this
// KB — show which agents") runs server-side only at DELETE time, returning
// HTTP 409 with the referencing agent ids in the error `detail` string. The
// UI surfaces that message rather than pre-computing usage client-side.

export type KBSourceType = "s3" | "url" | "upload" | "manual";
export type KBEmbeddingModel =
  | "amazon.titan-embed-text-v2:0"
  | "cohere.embed-english-v3"
  | "cohere.embed-multilingual-v3";
export type KBStatus = "INDEXING" | "READY" | "FAILED";

export interface KnowledgeBaseRecord {
  kb_id: string;
  tenant_id: string;
  name: string;
  description: string;
  source_type: KBSourceType;
  source_config: Record<string, unknown>;
  embedding_model: KBEmbeddingModel;
  chunk_size_tokens: number;
  chunk_overlap_pct: number;
  status: KBStatus;
  document_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description: string;
  source_type: KBSourceType;
  source_config: Record<string, unknown>;
  embedding_model?: KBEmbeddingModel;
  chunk_size_tokens?: number;
  chunk_overlap_pct?: number;
}

export interface KnowledgeBaseListResponse {
  items: KnowledgeBaseRecord[];
}
