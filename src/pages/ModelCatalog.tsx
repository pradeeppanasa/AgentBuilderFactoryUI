import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { getModelCatalog } from "@/api/platform";
import { Badge, LoadingSpinner } from "@/components/common";
import type { ModelInfo, ModelProviderId } from "@/types/platform";

// R37 — the provider/model catalog is backend-authoritative. This page is a
// read-only view of whatever LiteLLM is configured to route to; the UI must
// never hardcode production model IDs. There is no create/edit/delete here
// by design — model availability is a runtime deployment concern, not
// something the Factory Console manages directly.

const PROVIDER_LABELS: Record<ModelProviderId, string> = {
  bedrock: "Amazon Bedrock",
  azure_openai: "Azure OpenAI",
  self_hosted: "Self-hosted",
};

const PROVIDER_ORDER: ModelProviderId[] = ["bedrock", "azure_openai", "self_hosted"];

function groupByProvider(models: ModelInfo[]): Record<ModelProviderId, ModelInfo[]> {
  const grouped: Record<ModelProviderId, ModelInfo[]> = {
    bedrock: [],
    azure_openai: [],
    self_hosted: [],
  };
  for (const model of models) {
    (grouped[model.model_provider] ?? (grouped[model.model_provider] = [])).push(model);
  }
  return grouped;
}

export default function ModelCatalog() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform", "models"],
    queryFn: getModelCatalog,
  });

  const grouped = data ? groupByProvider(data.models) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Model Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Models routed via LiteLLM (Section 32.1). This list is controlled by the Factory
          Runtime — add or remove models by updating the runtime's provider configuration, not
          from here.
        </p>
      </div>

      {isLoading ? <LoadingSpinner label="Loading model catalog…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load the model catalog. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && data.models.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Cpu size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No models are configured in the runtime yet.
          </p>
        </div>
      ) : null}

      {grouped
        ? PROVIDER_ORDER.filter((provider) => grouped[provider].length > 0).map((provider) => (
            <div key={provider} className="space-y-3">
              <h2 className="text-sm font-semibold text-navy">{PROVIDER_LABELS[provider]}</h2>
              <div className="grid grid-cols-2 gap-4">
                {grouped[provider].map((model) => (
                  <div
                    key={model.model_id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-navy">{model.display_name}</p>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                          {model.model_id}
                        </p>
                      </div>
                      {model.supports_knowledge_base ? (
                        <Badge variant="success">RAG-ready</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        : null}
    </div>
  );
}
