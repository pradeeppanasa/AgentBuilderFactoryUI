import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { createAgent } from "@/api/agents";
import { getModelCatalog } from "@/api/platform";
import { Button, LoadingSpinner } from "@/components/common";
import { cn } from "@/lib/utils";

const AGENT_TYPES = [
  "conversational",
  "task",
  "rag",
  "multi-step",
  "orchestrator",
] as const;

// Display labels only — the set of providers and their models is always
// sourced from GET /api/v1/platform/models (R37). An unrecognised provider
// id from the API still renders correctly, just using its raw id as label.
const PROVIDER_LABELS: Record<string, string> = {
  bedrock: "AWS Bedrock",
  azure_openai: "Azure OpenAI",
  self_hosted: "Self-Hosted",
};

const PROVIDER_INFO: Record<string, string> = {
  azure_openai: "Azure credentials must be configured in platform settings.",
  self_hosted: "OPENAI_API_BASE must point to your inference endpoint.",
};

const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  business_purpose: z.string().min(1, "Business purpose is required"),
  agent_type: z.enum(AGENT_TYPES),
  model_id: z.string().min(1, "Model ID is required"),
  model_provider: z.string().min(1, "Model provider is required"),
  system_prompt: z.string().min(1, "System prompt is required"),
});

type CreateAgentFormValues = z.infer<typeof createAgentSchema>;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function CreateAgent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: catalog,
    isLoading: catalogLoading,
    isError: catalogError,
  } = useQuery({
    queryKey: ["platform", "models"],
    queryFn: getModelCatalog,
  });

  const modelsByProvider = useMemo(() => {
    const map = new Map<string, typeof catalog extends undefined ? never : NonNullable<typeof catalog>["models"]>();
    for (const model of catalog?.models ?? []) {
      const existing = map.get(model.model_provider);
      if (existing) {
        existing.push(model);
      } else {
        map.set(model.model_provider, [model]);
      }
    }
    return map;
  }, [catalog]);

  const providers = useMemo(() => Array.from(modelsByProvider.keys()), [
    modelsByProvider,
  ]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      agent_type: "task",
      model_provider: "",
      model_id: "",
    },
  });

  // Seed the provider/model fields once the catalog arrives — a one-time
  // default, not a reactive sync, so it never overwrites in-progress edits.
  useEffect(() => {
    if (providers.length > 0 && !getValues("model_provider")) {
      const firstProvider = providers[0];
      setValue("model_provider", firstProvider);
      setValue(
        "model_id",
        modelsByProvider.get(firstProvider)?.[0]?.model_id ?? "",
      );
    }
  }, [providers, modelsByProvider, getValues, setValue]);

  const selectedProvider = watch("model_provider");
  const modelsForProvider = modelsByProvider.get(selectedProvider) ?? [];

  const createMutation = useMutation({
    mutationFn: (values: CreateAgentFormValues) =>
      createAgent({
        name: values.name,
        description: values.description,
        business_purpose: values.business_purpose,
        agent_type: values.agent_type,
        configuration: {
          model_id: values.model_id,
          model_provider: values.model_provider as
            | "bedrock"
            | "azure_openai"
            | "self_hosted",
          system_prompt: values.system_prompt,
        },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
      navigate(`/agents/${result.agent_id}`);
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Create Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define the basics. Tools, guardrails, and knowledge bases are
          configured after creation.
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
      >
        <div>
          <label className="text-sm font-medium text-navy">Name</label>
          <input className={cn(inputClass, "mt-1")} {...register("name")} />
          {errors.name ? (
            <p className="mt-1 text-xs text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Description</label>
          <input
            className={cn(inputClass, "mt-1")}
            {...register("description")}
          />
          {errors.description ? (
            <p className="mt-1 text-xs text-destructive">
              {errors.description.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-navy">
            Business Purpose
          </label>
          <textarea
            className={cn(inputClass, "mt-1 min-h-20")}
            {...register("business_purpose")}
          />
          {errors.business_purpose ? (
            <p className="mt-1 text-xs text-destructive">
              {errors.business_purpose.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Agent Type</label>
          <select
            className={cn(inputClass, "mt-1")}
            {...register("agent_type")}
          >
            {AGENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Model</h2>

          {catalogLoading ? (
            <div className="mt-3">
              <LoadingSpinner label="Loading model catalog…" />
            </div>
          ) : catalogError ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Could not load the model catalog from the Factory Runtime.
              Model selection is unavailable until this is reachable.
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-navy">
                    Model Provider
                  </label>
                  <select
                    className={cn(inputClass, "mt-1")}
                    {...register("model_provider", {
                      onChange: (e) => {
                        const firstModel = modelsByProvider.get(
                          e.target.value,
                        )?.[0];
                        setValue("model_id", firstModel?.model_id ?? "");
                      },
                    })}
                  >
                    {providers.map((provider) => (
                      <option key={provider} value={provider}>
                        {PROVIDER_LABELS[provider] ?? provider}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-navy">
                    Model
                  </label>
                  {modelsForProvider.length > 0 ? (
                    <select
                      className={cn(inputClass, "mt-1")}
                      {...register("model_id")}
                    >
                      {modelsForProvider.map((model) => (
                        <option key={model.model_id} value={model.model_id}>
                          {model.display_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={cn(inputClass, "mt-1")}
                      placeholder="Enter model ID"
                      {...register("model_id")}
                    />
                  )}
                  {errors.model_id ? (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.model_id.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {PROVIDER_INFO[selectedProvider] ? (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {PROVIDER_INFO[selectedProvider]}
                </div>
              ) : null}

              <div className="flex items-start gap-2 rounded-md border-l-2 border-teal bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <Info size={14} className="mt-0.5 shrink-0 text-teal" />
                <span>
                  Auto retry and configured fallback are enabled via LiteLLM.
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-navy">
            System Prompt
          </label>
          <textarea
            className={cn(inputClass, "mt-1 min-h-32")}
            {...register("system_prompt")}
          />
          {errors.system_prompt ? (
            <p className="mt-1 text-xs text-destructive">
              {errors.system_prompt.message}
            </p>
          ) : null}
        </div>

        {createMutation.isError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Failed to create agent. Please try again.
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button
            type="submit"
            variant="accent"
            disabled={createMutation.isPending || catalogLoading || catalogError}
          >
            {createMutation.isPending ? "Creating…" : "Create Agent"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/agents")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
