import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTelemetryConfig, updateTelemetryConfig } from "@/api/platform";
import { LoadingSpinner } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import type { TelemetryCategory } from "@/types/platform";

const CATEGORY_LABELS: Record<TelemetryCategory, string> = {
  usage: "Usage",
  performance: "Performance",
  cost: "Cost",
  errors: "Errors",
};

const CATEGORY_DESCRIPTIONS: Record<TelemetryCategory, string> = {
  usage: "Agent/deployment IDs, model, request/trace IDs, status",
  performance: "Latency and throughput",
  cost: "Token counts and estimated cost",
  errors: "Error counts and categories — no messages or PII",
};

const CATEGORY_ORDER: TelemetryCategory[] = [
  "usage",
  "performance",
  "cost",
  "errors",
];

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-navy">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-input text-teal focus:ring-teal disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

export function TelemetryConfigPanel() {
  const role = useAuthStore((state) => state.currentUser?.role);
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const {
    data: config,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["platform", "telemetry-config"],
    queryFn: getTelemetryConfig,
  });

  const updateMutation = useMutation({
    mutationFn: updateTelemetryConfig,
    onSuccess: (updated) => {
      // The PUT response is the full authoritative config — write it
      // straight into the cache instead of refetching.
      queryClient.setQueryData(["platform", "telemetry-config"], updated);
    },
  });

  const controlsDisabled = !isAdmin || updateMutation.isPending;

  function setEnabled(next: boolean) {
    updateMutation.mutate({ enabled: next });
  }

  function setCategory(category: TelemetryCategory, next: boolean) {
    if (!config) return;
    // categories is replace-the-whole-object on the backend, so every
    // toggle sends all four fields — only "enabled" itself is left out,
    // preserving the top-level partial-update contract.
    updateMutation.mutate({
      categories: { ...config.categories, [category]: next },
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Telemetry</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sanitised operational metadata only — prompts, responses, and
        customer data never leave the VPC. Opt-in, default off.
      </p>

      {isLoading ? (
        <div className="mt-3">
          <LoadingSpinner size={20} />
        </div>
      ) : isError || !config ? (
        <p className="mt-3 text-sm text-destructive">
          Could not load telemetry configuration.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-border rounded-lg border border-border">
          <ToggleRow
            label="Telemetry enabled"
            description="Master switch — categories below only apply while this is on"
            checked={config.enabled}
            disabled={controlsDisabled}
            onChange={setEnabled}
          />
          {CATEGORY_ORDER.map((category) => (
            <ToggleRow
              key={category}
              label={CATEGORY_LABELS[category]}
              description={CATEGORY_DESCRIPTIONS[category]}
              checked={config.categories[category]}
              disabled={controlsDisabled}
              onChange={(next) => setCategory(category, next)}
            />
          ))}
        </div>
      )}

      {!isAdmin ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Read-only — only admins can change telemetry settings.
        </p>
      ) : null}

      {updateMutation.isError ? (
        <p className="mt-2 text-xs text-destructive">
          Failed to update telemetry settings. Please try again.
        </p>
      ) : null}
    </div>
  );
}
