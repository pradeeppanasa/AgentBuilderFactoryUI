import { Badge, InfoTooltip } from "@/components/common";

// Section 37.15: fields the API accepts and persists today but doesn't yet
// enforce at runtime. Never applied to live/enforced fields — see the
// STORED_ONLY_* notes in types/guardrail-policy.ts for which fields qualify.
export function ComingSoonBadge({ note }: { note: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant="secondary">Coming soon</Badge>
      <InfoTooltip text={note} />
    </span>
  );
}
