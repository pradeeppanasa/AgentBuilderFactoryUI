import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, HelpCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  approveHitlReview,
  listHitlReviews,
  rejectHitlReview,
  requestHitlInfo,
} from "@/api/hitl";
import { Badge, Button, LoadingSpinner, Modal } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn } from "@/lib/utils";
import type { HitlReviewRecord, HitlReviewStatus } from "@/types/hitl";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUS_VARIANT: Record<HitlReviewStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const QUERY_KEY = ["hitl", "reviews"];

function ReviewCard({
  review,
  canWrite,
  onOpenReject,
  onOpenRequestInfo,
}: {
  review: HitlReviewRecord;
  canWrite: boolean;
  onOpenReject: (review: HitlReviewRecord) => void;
  onOpenRequestInfo: (review: HitlReviewRecord) => void;
}) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => approveHitlReview(review.review_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-navy">{review.agent_name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{review.reason}</p>
        </div>
        <Badge variant={STATUS_VARIANT[review.status]}>{review.status}</Badge>
      </div>

      {/* R14/R30 — context_summary only, never the full prompt/tool payload. */}
      <p className="mt-3 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {review.context_summary}
      </p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Requested {new Date(review.requested_at).toLocaleString()}</span>
        {review.resolved_at ? (
          <span>
            Resolved {new Date(review.resolved_at).toLocaleString()}
            {review.resolved_by ? ` by ${review.resolved_by}` : ""}
          </span>
        ) : null}
      </div>

      {canWrite && review.status === "pending" ? (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <Button
            size="sm"
            variant="accent"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            <ThumbsUp size={14} />
            {approveMutation.isPending ? "Approving…" : "Approve"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onOpenReject(review)}>
            <ThumbsDown size={14} />
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenRequestInfo(review)}>
            <HelpCircle size={14} />
            Request info
          </Button>
        </div>
      ) : null}

      {approveMutation.isError ? (
        <p className="mt-2 text-xs text-destructive">
          {axiosErrorDetail(approveMutation.error) ?? "Failed to approve."}
        </p>
      ) : null}
    </div>
  );
}

export default function HitlReviews() {
  const [statusFilter, setStatusFilter] = useState<HitlReviewStatus | "all">("pending");
  const [rejectTarget, setRejectTarget] = useState<HitlReviewRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [infoTarget, setInfoTarget] = useState<HitlReviewRecord | null>(null);
  const [infoQuestion, setInfoQuestion] = useState("");

  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listHitlReviews,
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectHitlReview(rejectTarget!.review_id, { reason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  const requestInfoMutation = useMutation({
    mutationFn: () =>
      requestHitlInfo(infoTarget!.review_id, { question: infoQuestion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setInfoTarget(null);
      setInfoQuestion("");
    },
  });

  const items = data?.items ?? [];
  const visible = items.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const pendingCount = items.filter((r) => r.status === "pending").length;

  const FILTERS: { value: HitlReviewStatus | "all"; label: string }[] = [
    { value: "pending", label: `Pending (${pendingCount})` },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Human-in-the-Loop Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Decisions agents flagged for human approval (Section 38.5 HitlConfig). Approving or
          rejecting resumes the agent's paused execution; a full audit trail is kept per R14.
        </p>
      </div>

      <div className="flex gap-1.5 border-b border-border">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              statusFilter === f.value
                ? "border-teal text-teal"
                : "border-transparent text-muted-foreground hover:text-navy",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner label="Loading reviews…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load HITL reviews. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <ClipboardCheck size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {statusFilter === "pending" ? "No reviews waiting on you." : "No reviews here."}
          </p>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              canWrite={canWrite}
              onOpenReject={setRejectTarget}
              onOpenRequestInfo={setInfoTarget}
            />
          ))}
        </div>
      ) : null}

      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title={`Reject review — ${rejectTarget?.agent_name ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending ? "Rejecting…" : "Reject"}
            </Button>
          </>
        }
      >
        <label className="text-sm font-medium text-navy">Reason</label>
        <textarea
          className={cn(inputClass, "mt-1 h-24 resize-y")}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Why is this decision being rejected?"
        />
        {rejectMutation.isError ? (
          <p className="mt-2 text-xs text-destructive">
            {axiosErrorDetail(rejectMutation.error) ?? "Failed to reject."}
          </p>
        ) : null}
      </Modal>

      <Modal
        open={infoTarget !== null}
        onClose={() => setInfoTarget(null)}
        title={`Request info — ${infoTarget?.agent_name ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInfoTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={!infoQuestion.trim() || requestInfoMutation.isPending}
              onClick={() => requestInfoMutation.mutate()}
            >
              {requestInfoMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </>
        }
      >
        <label className="text-sm font-medium text-navy">Question</label>
        <textarea
          className={cn(inputClass, "mt-1 h-24 resize-y")}
          value={infoQuestion}
          onChange={(e) => setInfoQuestion(e.target.value)}
          placeholder="What additional information do you need before deciding?"
        />
        {requestInfoMutation.isError ? (
          <p className="mt-2 text-xs text-destructive">
            {axiosErrorDetail(requestInfoMutation.error) ?? "Failed to send."}
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
