import { useState } from "react";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Badge } from "@/components/common";
import { cn, formatCostUsd, formatDuration } from "@/lib/utils";
import type { RagasMetric, RunRecord, RunStep, StepStatus } from "@/types/runs";

const RAGAS_LABELS: Record<RagasMetric, string> = {
  faithfulness: "Faithfulness",
  answer_relevance: "Answer Relevance",
  context_precision: "Context Precision",
  context_recall: "Context Recall",
  context_relevance: "Context Relevance",
};

// Section 9 — KB Retrieval panel. `query` is always "[REDACTED]" (R30) —
// rendered verbatim from the API, never a real query string.
function RagPanel({ step }: { step: RunStep }) {
  const rag = step.rag;
  if (!rag) return null;
  return (
    <div className="mt-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
      <p className="mb-1.5 font-medium text-navy">Knowledge Base Retrieval</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
        <div>
          <dt className="inline">Query: </dt>
          <dd className="inline text-navy">{rag.query}</dd>
        </div>
        <div>
          <dt className="inline">Documents returned: </dt>
          <dd className="inline text-navy">{rag.documents_returned}</dd>
        </div>
        <div>
          <dt className="inline">Relevant (≥ {rag.relevance_threshold.toFixed(2)}): </dt>
          <dd className="inline text-navy">{rag.relevant_count}</dd>
        </div>
        <div>
          <dt className="inline">Retrieval latency: </dt>
          <dd className="inline text-navy">{formatDuration(rag.retrieval_latency_ms)}</dd>
        </div>
      </dl>
      <div className="mt-2 space-y-1">
        {rag.documents.map((doc) => (
          <div key={doc.label} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-muted-foreground">{doc.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  doc.relevance >= rag.relevance_threshold ? "bg-teal" : "bg-muted-foreground/40",
                )}
                style={{ width: `${doc.relevance * 100}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-navy">
              {doc.relevance.toFixed(2)}
            </span>
            {doc.relevance < rag.relevance_threshold ? (
              <span className="shrink-0 text-[10px] text-muted-foreground">below threshold</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// Section 9 — RAG Evaluation panel, run-level (not per-step). Only
// rendered when the agent has RAGAS evaluation enabled (R13/R14).
function RagasPanel({ scores }: { scores: Partial<Record<RagasMetric, number>> }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 text-xs">
      <p className="mb-1.5 font-medium text-navy">RAG Evaluation — This Run</p>
      <div className="space-y-1.5">
        {(Object.entries(scores) as [RagasMetric, number][]).map(([metric, score]) => (
          <div key={metric} className="flex items-center gap-2">
            <span className="w-36 shrink-0 text-muted-foreground">{RAGAS_LABELS[metric]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-teal" style={{ width: `${score * 100}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-navy">
              {score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Observability — Runs Feature, Phase 2, Section 5. This is the primary
// run detail view now — a Gantt-style breakdown of where the run's time
// (and cost/tokens) actually went, replacing Phase 1's header-only view.
// R30: `name`/`component` are always pre-written labels, never raw
// prompt/response content or a stringified payload.

const STEP_STATUS_COLOR: Record<StepStatus, string> = {
  SUCCESS: "bg-teal",
  FAILED: "bg-destructive",
  RUNNING: "bg-amber-400 animate-pulse",
};

function StepBar({ step, totalMs }: { step: RunStep; totalMs: number }) {
  const widthPct =
    totalMs > 0 && step.duration_ms !== null
      ? Math.max((step.duration_ms / totalMs) * 100, 1.5)
      : 8; // indeterminate (still running) — a small fixed sliver, not a fake precise width
  const offsetPct = totalMs > 0 ? (step.start_offset_ms / totalMs) * 100 : 0;

  return (
    <div className="relative h-4 w-full rounded-full bg-muted">
      <div
        className={cn("absolute h-4 rounded-full", STEP_STATUS_COLOR[step.status])}
        style={{ left: `${offsetPct}%`, width: `${widthPct}%` }}
      />
    </div>
  );
}

// Section 6 — business explanation always shown; raw error code, request
// ID, trace ID, region are "Technical details", collapsed by default.
function StepErrorPanel({ step }: { step: RunStep }) {
  const [showTechnical, setShowTechnical] = useState(false);
  const error = step.error;
  if (!error) return null;

  return (
    <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
      <p className="font-semibold text-destructive">
        ✕ Run failed — Step: {step.name}
      </p>
      <dl className="mt-2 space-y-1">
        <div>
          <dt className="inline font-medium text-navy">Component: </dt>
          <dd className="inline">{step.component}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-navy">Reason: </dt>
          <dd className="inline">{error.business_reason}</dd>
        </div>
      </dl>
      <div className="mt-2 rounded bg-card p-2">
        <p className="font-medium text-navy">Recommended action</p>
        <p className="mt-0.5 text-muted-foreground">{error.recommended_action}</p>
      </div>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(error.request_id ?? error.raw_error_code)}
        className="mt-2 inline-flex items-center gap-1 text-muted-foreground hover:text-navy"
      >
        <Copy size={11} />
        Copy error ID
      </button>

      <button
        type="button"
        onClick={() => setShowTechnical((v) => !v)}
        className="mt-2 flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-navy"
      >
        {showTechnical ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Technical details
      </button>
      {showTechnical ? (
        <dl className="mt-1.5 space-y-0.5 pl-4 font-mono text-[11px] text-muted-foreground">
          {error.request_id ? <div>Request ID: {error.request_id}</div> : null}
          {error.trace_id ? <div>Trace ID: {error.trace_id}</div> : null}
          <div>AWS error: {error.raw_error_code}</div>
          <div>Timestamp: {error.occurred_at}</div>
          {error.region ? <div>Region: {error.region}</div> : null}
        </dl>
      ) : null}
    </div>
  );
}

function StepDetailPanel({ step }: { step: RunStep }) {
  if (step.error) return <StepErrorPanel step={step} />;

  const hasModelDetail = step.model_id !== null;
  return (
    <div className="mt-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
      <p className="mb-1.5 font-medium text-navy">{step.component}{hasModelDetail ? ` — ${step.model_id}` : ""}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
        <div>
          <dt className="inline">Latency: </dt>
          <dd className="inline text-navy">{formatDuration(step.duration_ms)}</dd>
        </div>
        <div>
          <dt className="inline">Status: </dt>
          <dd className="inline text-navy">{step.status}</dd>
        </div>
        {step.input_tokens !== null ? (
          <div>
            <dt className="inline">Input tokens: </dt>
            <dd className="inline text-navy">{step.input_tokens.toLocaleString()}</dd>
          </div>
        ) : null}
        {step.output_tokens !== null ? (
          <div>
            <dt className="inline">Output tokens: </dt>
            <dd className="inline text-navy">{step.output_tokens.toLocaleString()}</dd>
          </div>
        ) : null}
        {step.cost_usd !== null ? (
          <div>
            <dt className="inline">Cost: </dt>
            <dd className="inline text-navy">{formatCostUsd(step.cost_usd)}</dd>
          </div>
        ) : null}
        {step.retry_count !== null ? (
          <div>
            <dt className="inline">Retry count: </dt>
            <dd className="inline text-navy">{step.retry_count}</dd>
          </div>
        ) : null}
      </dl>
      <RagPanel step={step} />
    </div>
  );
}

// Section 10 — per-run latency/token/cost breakdown, grouped by category.
// Derived entirely from `run.steps` — no separate backend aggregation
// endpoint needed for a single run's own data.
function categoryFor(step: RunStep): string {
  if (step.component === "Guardrail Engine") return "Guardrail";
  if (step.component === "Orchestrator") return "Orchestration";
  if (step.component === "Knowledge Base") return "RAG retrieval";
  if (step.component === "Amazon Bedrock") return "LLM";
  if (step.component.startsWith("Tool:")) return "Tool calls";
  return "Other";
}

function CostPerformanceBreakdown({ run }: { run: RunRecord }) {
  if (run.steps.length === 0 || run.duration_ms === null) return null;

  const byCategory = new Map<string, number>();
  for (const step of run.steps) {
    const category = categoryFor(step);
    byCategory.set(category, (byCategory.get(category) ?? 0) + (step.duration_ms ?? 0));
  }
  const totalTokens = run.steps.reduce(
    (sum, s) => sum + (s.input_tokens ?? 0) + (s.output_tokens ?? 0),
    0,
  );
  const inputTokens = run.steps.reduce((sum, s) => sum + (s.input_tokens ?? 0), 0);
  const outputTokens = run.steps.reduce((sum, s) => sum + (s.output_tokens ?? 0), 0);
  const llmCost = run.steps.reduce((sum, s) => sum + (s.cost_usd ?? 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
      <div>
        <p className="mb-1.5 font-medium text-navy">Latency breakdown</p>
        <div className="space-y-1">
          {[...byCategory.entries()].map(([category, ms]) => (
            <div key={category} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-muted-foreground">{category}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${((ms / (run.duration_ms ?? 1)) * 100).toFixed(1)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-navy">
                {formatDuration(ms)} ({Math.round((ms / (run.duration_ms ?? 1)) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 font-medium text-navy">Token usage &amp; cost</p>
        <dl className="space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <dt>Input</dt>
            <dd className="text-navy">{inputTokens.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Output</dt>
            <dd className="text-navy">{outputTokens.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Total</dt>
            <dd className="text-navy">{totalTokens.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1">
            <dt>LLM cost</dt>
            <dd className="text-navy">{formatCostUsd(llmCost)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Total run cost</dt>
            <dd className="text-navy">{formatCostUsd(run.cost_usd)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function ExecutionTimeline({ run }: { run: RunRecord }) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  if (run.steps.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No Execution Timeline recorded for this run — see the Activity Feed instead.
      </p>
    );
  }

  // Running total known so far — for a still-in-flight run, use the
  // furthest known offset+duration rather than the (absent) final
  // duration_ms, so the Gantt bars stay proportionate instead of all
  // collapsing to the indeterminate sliver.
  const totalMs =
    run.duration_ms ??
    Math.max(...run.steps.map((s) => s.start_offset_ms + (s.duration_ms ?? 0)), 1);

  const selectedStep = run.steps.find((s) => s.step_id === selectedStepId) ?? null;

  return (
    <div className="space-y-1.5">
      {run.steps.map((step) => {
        const selected = step.step_id === selectedStepId;
        return (
          <div key={step.step_id}>
            <button
              type="button"
              onClick={() => setSelectedStepId(selected ? null : step.step_id)}
              className={cn(
                "grid w-full grid-cols-[1fr_70px_1fr] items-center gap-3 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                selected ? "bg-teal/5" : "hover:bg-muted/30",
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                {step.status === "FAILED" ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                    !
                  </Badge>
                ) : null}
                {step.name}
              </span>
              <span className="text-right font-mono text-muted-foreground">
                {formatDuration(step.duration_ms)}
              </span>
              <StepBar step={step} totalMs={totalMs} />
            </button>
            {selected ? <StepDetailPanel step={step} /> : null}
          </div>
        );
      })}
      {selectedStep === null ? (
        <p className="pt-1 text-[11px] text-muted-foreground">
          Click a step above to see its detail.
        </p>
      ) : null}

      {run.ragas_scores ? <RagasPanel scores={run.ragas_scores} /> : null}
      <CostPerformanceBreakdown run={run} />
    </div>
  );
}
