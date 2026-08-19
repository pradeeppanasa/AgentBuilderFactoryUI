import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { saveOtelEndpoint } from "@/api/observability";
import { Button } from "@/components/common";
import { axiosErrorDetail, cn } from "@/lib/utils";
import { isValidHttpUrl } from "@/types/observability";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface OtelEndpointFormProps {
  initialEndpoint: string | null;
  canWrite: boolean;
  onSaved: (endpoint: string) => void;
}

export function OtelEndpointForm({ initialEndpoint, canWrite, onSaved }: OtelEndpointFormProps) {
  const [endpoint, setEndpoint] = useState(initialEndpoint ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () => saveOtelEndpoint({ endpoint }),
    onSuccess: (result) => {
      setSaved(true);
      onSaved(result.endpoint ?? endpoint);
      window.setTimeout(() => setSaved(false), 3000);
    },
  });

  function handleSave() {
    setSaved(false);
    if (!isValidHttpUrl(endpoint)) {
      setValidationError("Must be a valid URL starting with http:// or https://");
      return;
    }
    setValidationError(null);
    mutation.mutate();
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">OTel Collector Endpoint</h2>
      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <input
            className={cn(inputClass)}
            placeholder="http://localhost:4317"
            value={endpoint}
            disabled={!canWrite}
            onChange={(e) => {
              setEndpoint(e.target.value);
              setValidationError(null);
            }}
          />
        </div>
        <Button
          variant="accent"
          disabled={!canWrite || mutation.isPending || !endpoint}
          onClick={handleSave}
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Spans from the agent runtime are exported to this endpoint. This is typically your
        customer-controlled OTel collector, AWS Distro for OTel (ADOT), or a local X-Ray daemon.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Compatible with any OTLP-receiving backend. Langfuse, Datadog, Grafana/Loki, New Relic,
        and Dynatrace each have their own card below — use this field only for a collector this
        page has no dedicated card for.
      </p>

      {validationError ? (
        <p className="mt-2 text-xs text-destructive">{validationError}</p>
      ) : null}
      {mutation.isError ? (
        <p className="mt-2 text-xs text-destructive">
          {axiosErrorDetail(mutation.error) ?? "Failed to save OTel endpoint."}
        </p>
      ) : null}
      {saved ? <p className="mt-2 text-xs text-emerald-700">OTel endpoint saved.</p> : null}
    </div>
  );
}
