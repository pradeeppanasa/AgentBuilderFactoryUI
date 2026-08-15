import { ArrowRight } from "lucide-react";

// Pinned, non-interactive 3-layer flow diagram (37.14) — shown at the top of
// the policy editor above every section. Purely informational.
export function PipelineDiagram() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-muted/20 p-4 text-xs">
      <div className="flex min-w-40 flex-col items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-center">
        <span className="font-medium text-purple-800">Layer 1 · BERT</span>
        <span className="text-purple-700">local, ~50ms, inside VPC</span>
      </div>
      <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
      <div className="flex min-w-40 flex-col items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-center">
        <span className="font-medium text-navy">unsure?</span>
        <span className="text-muted-foreground">escalate 0.40–0.85</span>
      </div>
      <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
      <div className="flex min-w-40 flex-col items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center">
        <span className="font-medium text-blue-800">Layer 2 · Bedrock</span>
        <span className="text-blue-700">content filters</span>
      </div>
      <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
      <div className="flex min-w-40 flex-col items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
        <span className="font-medium text-emerald-800">Layer 3 · LLM</span>
        <span className="text-emerald-700">output → Layer 2 only</span>
      </div>
    </div>
  );
}
