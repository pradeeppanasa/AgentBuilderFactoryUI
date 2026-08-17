import type { ReactNode } from "react";
import { Badge, Toggle } from "@/components/common";

interface IntegrationCardProps {
  title: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: (next: boolean) => void;
  children?: ReactNode; // fields — only rendered while enabled
  footer?: ReactNode; // save button + status messages
}

// Shared shell for Langfuse / Datadog (Section 3 — "Optional Integrations").
// The toggle is the primary control; fields only appear once enabled, per
// the design rule: "never imply Langfuse/Datadog are required."
export function IntegrationCard({
  title,
  description,
  enabled,
  disabled,
  onToggle,
  children,
  footer,
}: IntegrationCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-navy">{title}</p>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant={enabled ? "success" : "outline"}>
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-navy">
        <Toggle checked={enabled} onChange={onToggle} disabled={disabled} />
        Enable {title}
      </label>

      {enabled ? <div className="mt-4 space-y-3">{children}</div> : null}
      {enabled && footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
