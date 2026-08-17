import { httpClient } from "./http";
import type {
  HitlReviewListResponse,
  HitlReviewRecord,
  RejectHitlReviewRequest,
  RequestInfoHitlReviewRequest,
} from "@/types/hitl";

export async function listHitlReviews(): Promise<HitlReviewListResponse> {
  const { data } = await httpClient.get<HitlReviewListResponse>("/hitl/reviews");
  return data;
}

export async function getHitlReview(reviewId: string): Promise<HitlReviewRecord> {
  const { data } = await httpClient.get<HitlReviewRecord>(`/hitl/reviews/${reviewId}`);
  return data;
}

export async function approveHitlReview(reviewId: string): Promise<HitlReviewRecord> {
  const { data } = await httpClient.post<HitlReviewRecord>(
    `/hitl/reviews/${reviewId}/approve`,
  );
  return data;
}

export async function rejectHitlReview(
  reviewId: string,
  request: RejectHitlReviewRequest,
): Promise<HitlReviewRecord> {
  const { data } = await httpClient.post<HitlReviewRecord>(
    `/hitl/reviews/${reviewId}/reject`,
    request,
  );
  return data;
}

export async function requestHitlInfo(
  reviewId: string,
  request: RequestInfoHitlReviewRequest,
): Promise<HitlReviewRecord> {
  const { data } = await httpClient.post<HitlReviewRecord>(
    `/hitl/reviews/${reviewId}/request-info`,
    request,
  );
  return data;
}
