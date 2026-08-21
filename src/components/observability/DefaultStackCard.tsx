import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { getObservabilityCapabilities } from "@/api/observability";
import { LoadingSpinner } from "@/components/common";
import { cn } from "@/lib/utils";
import {
  CAPABILITY_LABELS,
  type CapabilityStatus,
  type ObservabilityCapability,
} from "@/types/observability";

// Capability Discovery: the platform discovers observability capabilities
// from the deployment's registered configuration and runtime metadata
// (GET /admin/settings/observability/capabilities) — this card renders
// whatever comes back using provider-neutral capability names (Logs,
// Metrics, Distributed Tracing, OpenTelemetry). Which specific provider
// backs a capability (CloudWatch, X-Ray, Langfuse, ...) is resolved by
// backend infrastructure adapters and only ever surfaces here as secondary
// disclosure text — never as something this component's rendering logic
// branches on. No toggle, no edit button: these are provisioned by
// Terraform during deployment, not something this settings page controls.
const STATUS_STYLES: Record<CapabilityStatus, { dot: string; text: string; label: string }> = {
  active: { dot: "bg-emerald-400", text: "text-emerald-300", label: "Active" },
  unknown: { dot: "bg-amber-400", text: "text-amber-300", label: "Configured" },
  inactive: { dot: "bg-white/30", text: "text-white/50", label: "Not configured" },
};

function CapabilityCard({ capability }: { capability: ObservabilityCapability }) {
  const style = STATUS_STYLES[capability.status];
  return (
    <div className="rounded-lg border border-teal/40 bg-navy p-4 text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{CAPABILITY_LABELS[capability.capability]}</p>
        <Lock size={13} className="text-white/40" />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", style.dot)} />
        <span className={cn("text-xs font-medium", style.text)}>{style.label}</span>
      </div>
      <p className="mt-2 text-xs text-white/60">{capability.detail}</p>
    </div>
  );
}

export function DefaultStackCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "settings", "observability", "capabilities"],
    queryFn: getObservabilityCapabilities,
  });

  if (isLoading) {
    return <LoadingSpinner label="Discovering observability capabilities…" />;
  }

  if (isError || !data) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Could not discover observability capabilities.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.capabilities.map((capability) => (
        <CapabilityCard key={capability.capability} capability={capability} />
      ))}
    </div>
  );
}
