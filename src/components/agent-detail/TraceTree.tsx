import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { RunRecord, Span } from "@/types/runs";

// Observability — Runs Feature, Phase 3, Section 7. Developer-only view:
// the same run's spans as a parent/child tree instead of a flat Gantt.
// R30/R45: `attributes` are already scrubbed server-side (metadata only,
// never prompt/response/tool-payload content) — rendered as-is, nothing
// further to redact client-side.

function buildTree(spans: Span[]): Map<string | null, Span[]> {
  const byParent = new Map<string | null, Span[]>();
  for (const span of spans) {
    const key = span.parent_span_id;
    const siblings = byParent.get(key) ?? [];
    siblings.push(span);
    byParent.set(key, siblings);
  }
  return byParent;
}

function SpanNode({
  span,
  byParent,
  depth,
  selectedSpanId,
  onSelect,
}: {
  span: Span;
  byParent: Map<string | null, Span[]>;
  depth: number;
  selectedSpanId: string | null;
  onSelect: (spanId: string) => void;
}) {
  const children = byParent.get(span.span_id) ?? [];
  const [collapsed, setCollapsed] = useState(false);
  const selected = span.span_id === selectedSpanId;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(span.span_id)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs hover:bg-muted/30",
          selected ? "bg-teal/5" : "",
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        {children.length > 0 ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((v) => !v);
            }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </span>
        ) : (
          <span className="w-3" />
        )}
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 text-[10px] font-medium",
            span.status === "SUCCESS"
              ? "bg-emerald-100 text-emerald-700"
              : span.status === "FAILED"
                ? "bg-red-100 text-destructive"
                : "bg-amber-100 text-amber-700",
          )}
        >
          {span.status === "SUCCESS" ? "✓" : span.status === "FAILED" ? "✗" : "…"}
        </span>
        <span className="flex-1 truncate text-navy">{span.name}</span>
        <span className="shrink-0 font-mono text-muted-foreground">
          {formatDuration(span.duration_ms)}
        </span>
      </button>
      {!collapsed
        ? children.map((child) => (
            <SpanNode
              key={child.span_id}
              span={child}
              byParent={byParent}
              depth={depth + 1}
              selectedSpanId={selectedSpanId}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export function TraceTree({ run }: { run: RunRecord }) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  if (run.spans.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No trace recorded for this run — tracing may not be enabled for this agent.
      </p>
    );
  }

  const byParent = buildTree(run.spans);
  const roots = byParent.get(null) ?? [];
  const selectedSpan = run.spans.find((s) => s.span_id === selectedSpanId) ?? null;
  const totalDurationMs = run.duration_ms ?? Math.max(...run.spans.map((s) => s.duration_ms ?? 0));

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] text-muted-foreground">
        {formatDuration(totalDurationMs)} · {run.spans.length} spans
      </p>
      <div className="rounded-md border border-border bg-card p-2">
        {roots.map((root) => (
          <SpanNode
            key={root.span_id}
            span={root}
            byParent={byParent}
            depth={0}
            selectedSpanId={selectedSpanId}
            onSelect={setSelectedSpanId}
          />
        ))}
      </div>

      {selectedSpan ? (
        <div className="rounded-md border border-border bg-muted/20 p-3 text-xs">
          <p className="mb-1.5 font-medium text-navy">{selectedSpan.name}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
            <div>
              <dt className="inline">Span ID: </dt>
              <dd className="inline font-mono text-navy">{selectedSpan.span_id}</dd>
            </div>
            <div>
              <dt className="inline">Parent span ID: </dt>
              <dd className="inline font-mono text-navy">
                {selectedSpan.parent_span_id ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="inline">Duration: </dt>
              <dd className="inline text-navy">{formatDuration(selectedSpan.duration_ms)}</dd>
            </div>
            <div>
              <dt className="inline">Status: </dt>
              <dd className="inline text-navy">{selectedSpan.status}</dd>
            </div>
          </dl>
          {Object.keys(selectedSpan.attributes).length > 0 ? (
            <div className="mt-2">
              <p className="mb-1 font-medium text-navy">Attributes</p>
              <dl className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
                {Object.entries(selectedSpan.attributes).map(([key, value]) => (
                  <div key={key}>
                    {key}: <span className="text-navy">{value}</span>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          {Object.keys(selectedSpan.tags).length > 0 ? (
            <div className="mt-2">
              <p className="mb-1 font-medium text-navy">Tags</p>
              <dl className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
                {Object.entries(selectedSpan.tags).map(([key, value]) => (
                  <div key={key}>
                    {key}: <span className="text-navy">{value}</span>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
