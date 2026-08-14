import { httpClient } from "./http";
import type {
  CreateKnowledgeBaseRequest,
  KnowledgeBaseListResponse,
  KnowledgeBaseRecord,
} from "@/types/knowledge-base";

export async function listKnowledgeBases(): Promise<KnowledgeBaseListResponse> {
  const { data } = await httpClient.get<KnowledgeBaseListResponse>(
    "/platform/knowledge-bases",
  );
  return data;
}

export async function getKnowledgeBase(kbId: string): Promise<KnowledgeBaseRecord> {
  const { data } = await httpClient.get<KnowledgeBaseRecord>(
    `/platform/knowledge-bases/${kbId}`,
  );
  return data;
}

export async function createKnowledgeBase(
  request: CreateKnowledgeBaseRequest,
): Promise<KnowledgeBaseRecord> {
  const { data } = await httpClient.post<KnowledgeBaseRecord>(
    "/platform/knowledge-bases",
    request,
  );
  return data;
}

export async function deleteKnowledgeBase(kbId: string): Promise<void> {
  await httpClient.delete(`/platform/knowledge-bases/${kbId}`);
}

export async function reindexKnowledgeBase(kbId: string): Promise<KnowledgeBaseRecord> {
  const { data } = await httpClient.post<KnowledgeBaseRecord>(
    `/platform/knowledge-bases/${kbId}/reindex`,
  );
  return data;
}
