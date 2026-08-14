import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Minimize2,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getAgent, updateAgent } from "@/api/agents";
import { getModelCatalog } from "@/api/platform";
import { listConnectors } from "@/api/connectors";
import { listKnowledgeBases } from "@/api/knowledge-bases";
import { listGuardrailPolicies } from "@/api/guardrail-policies";
import {
  Badge,
  Button,
  InfoTooltip,
  LoadingSpinner,
  OptionCard,
  Slider,
  Toggle,
} from "@/components/common";
import { cn } from "@/lib/utils";
import type {
  AgentConfiguration,
  KBConfig,
  MemoryConfig,
  ToolConfig,
} from "@/types/agent";
import type { KBStatus, KnowledgeBaseRecord } from "@/types/knowledge-base";
import type { GuardrailPolicy } from "@/types/guardrail-policy";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const CHUNK_STRATEGIES = [
  { value: "semantic", label: "Semantic", description: "Splits by meaning, not fixed length" },
  { value: "fixed", label: "Fixed size", description: "Equal-sized chunks" },
  { value: "paragraph", label: "Paragraph", description: "One chunk per paragraph" },
] as const;

const KB_STATUS_VARIANT: Record<KBStatus, "success" | "warning" | "destructive"> = {
  READY: "success",
  INDEXING: "warning",
  FAILED: "destructive",
};

function describeTemperature(value: number): string {
  if (value <= 0.3) return "More precise — focused, consistent answers";
  if (value >= 0.8) return "More creative — varied, exploratory answers";
  return "Balanced between precise and creative";
}

function describeTopP(value: number): string {
  if (value <= 0.5) return "Considers only the most likely next words";
  if (value >= 0.95) return "Considers nearly all possible next words";
  return "Moderate range of word choices considered";
}

export default function EditAgent() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["agents", "detail", agentId],
    queryFn: () => getAgent(agentId as string),
    enabled: Boolean(agentId),
  });

  const { data: catalog } = useQuery({
    queryKey: ["platform", "models"],
    queryFn: getModelCatalog,
  });

  const { data: connectorData } = useQuery({
    queryKey: ["connectors", "list"],
    queryFn: listConnectors,
  });

  const { data: kbData } = useQuery({
    queryKey: ["knowledge-bases", "list"],
    queryFn: listKnowledgeBases,
  });

  const { data: policyData } = useQuery({
    queryKey: ["guardrail-policies", "list"],
    queryFn: listGuardrailPolicies,
  });

  const modelsByProvider = useMemo(() => {
    const map = new Map<string, NonNullable<typeof catalog>["models"]>();
    for (const model of catalog?.models ?? []) {
      const existing = map.get(model.model_provider);
      if (existing) existing.push(model);
      else map.set(model.model_provider, [model]);
    }
    return map;
  }, [catalog]);

  const [draft, setDraft] = useState<AgentConfiguration | null>(null);
  const [expertOpen, setExpertOpen] = useState(false);
  const [kbAdvancedOpen, setKbAdvancedOpen] = useState(false);
  const [guardrailAdvancedOpen, setGuardrailAdvancedOpen] = useState(false);
  const [changeDescription, setChangeDescription] = useState("");

  // Seed the draft once from the loaded configuration — an editable copy,
  // never re-synced on refetch so it doesn't clobber in-progress edits.
  useEffect(() => {
    if (data && !draft) {
      setDraft(data.configuration);
    }
  }, [data, draft]);

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!draft || !agentId) throw new Error("Not ready");
      return updateAgent(agentId, {
        configuration: draft,
        change_description: changeDescription.trim() || "Updated via agent editor",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "detail", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agents", agentId, "versions"] });
      navigate(`/agents/${agentId}`);
    },
  });

  if (isLoading || !draft) {
    return <LoadingSpinner label="Loading agent…" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Agent not found or could not be loaded.
      </div>
    );
  }

  const providers = Array.from(modelsByProvider.keys());
  const modelsForProvider = modelsByProvider.get(draft.model_provider) ?? [];
  const connectors = connectorData?.items ?? [];
  const knowledgeBases = kbData?.items ?? [];
  const guardrailPolicies = policyData?.items ?? [];
  const selectedToolIds = new Set(draft.tools.map((t) => t.tool_id));

  function patch(fields: Partial<AgentConfiguration>) {
    setDraft((prev) => (prev ? { ...prev, ...fields } : prev));
  }

  function toggleTool(toolId: string) {
    if (!draft) return;
    if (selectedToolIds.has(toolId)) {
      patch({ tools: draft.tools.filter((t) => t.tool_id !== toolId) });
      return;
    }
    const connector = connectors.find((c) => c.connector_id === toolId);
    if (!connector) return;
    const newTool: ToolConfig = {
      tool_id: connector.connector_id,
      tool_name: connector.name,
      executor_type: connector.executor_type,
      endpoint: connector.endpoint_template,
      lambda_arn: null,
      input_schema: connector.input_schema,
      credentials_secret_arn: null,
      connection_id: null,
    };
    patch({ tools: [...draft.tools, newTool] });
  }

  function patchKB(fields: Partial<KBConfig>) {
    // draft is guaranteed non-null here — these helpers are only ever
    // called from JSX rendered after the `!draft` early-return above, but
    // TS can't carry that narrowing across the closure boundary.
    if (!draft?.knowledge_base) return;
    patch({ knowledge_base: { ...draft.knowledge_base, ...fields } });
  }

  function patchMemory(fields: Partial<MemoryConfig>) {
    if (!draft) return;
    patch({ memory: { ...draft.memory, ...fields } });
  }

  // Selecting a library KB is the primary flow (37 amendment #3: "catalog-
  // based picker... store kb_id... do not duplicate KB configuration inside
  // the agent"). The inline `knowledge_base` field still drives IaC
  // generation today (it's additive, not replaced — see the backend's own
  // comment in registry/models.py), so picking a library KB also mirrors
  // its name/embedding model into that field rather than leaving it stale;
  // retrieval tuning (top K, chunk strategy, reranking) has no equivalent
  // in the library record and stays a per-agent "Advanced" choice below.
  function selectKnowledgeBase(kb: KnowledgeBaseRecord | null) {
    if (!draft) return;
    if (kb === null) {
      patch({ kb_id: null, knowledge_base: null });
      return;
    }
    const bucket = kb.source_config?.bucket;
    patch({
      kb_id: kb.kb_id,
      knowledge_base: {
        enabled: true,
        kb_name: kb.name,
        s3_bucket: typeof bucket === "string" ? bucket : null,
        embedding_model: kb.embedding_model,
        chunk_strategy: draft.knowledge_base?.chunk_strategy ?? "semantic",
        top_k: draft.knowledge_base?.top_k ?? 5,
        reranking_enabled: draft.knowledge_base?.reranking_enabled ?? true,
      },
    });
  }

  function selectGuardrailPolicy(policy: GuardrailPolicy | null) {
    patch({ guardrail_policy_id: policy?.policy_id ?? null });
  }

  return (
    <div className="max-w-3xl space-y-6 pb-16">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-navy">Edit Agent</h1>
          <Badge variant="secondary">{data.agent.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.agent.name} · {data.agent.agent_id} · v{data.agent.current_version}
        </p>
      </div>

      {/* ── Model ─────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">Model</h2>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-navy">Provider</label>
            <select
              className={cn(inputClass, "mt-1")}
              value={draft.model_provider}
              onChange={(e) => {
                const provider = e.target.value as AgentConfiguration["model_provider"];
                const firstModel = modelsByProvider.get(provider)?.[0];
                patch({ model_provider: provider, model_id: firstModel?.model_id ?? draft.model_id });
              }}
            >
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Model</label>
            {modelsForProvider.length > 0 ? (
              <select
                className={cn(inputClass, "mt-1")}
                value={draft.model_id}
                onChange={(e) => patch({ model_id: e.target.value })}
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
                value={draft.model_id}
                onChange={(e) => patch({ model_id: e.target.value })}
              />
            )}
          </div>
        </div>

        {/* Advanced settings — Level 2, hidden by default (Principle #1) */}
        <div className="mt-4 space-y-4 rounded-md border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-navy">Temperature</label>
            <InfoTooltip text="Lower values make answers more focused and repeatable. Higher values make them more varied and exploratory." />
          </div>
          <Slider
            label=""
            value={draft.temperature}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => patch({ temperature: v })}
            describe={describeTemperature}
          />

          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-navy">Top P</label>
            <InfoTooltip text="Narrows or widens how many possible next words the model considers at each step." />
          </div>
          <Slider
            label=""
            value={draft.top_p}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => patch({ top_p: v })}
            describe={describeTopP}
          />

          <button
            type="button"
            onClick={() => setExpertOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-teal hover:text-teal-600"
          >
            {expertOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Expert settings
          </button>

          {expertOpen ? (
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
              <div>
                <label className="text-sm font-medium text-navy">Max output tokens</label>
                <input
                  type="number"
                  min={1}
                  max={8192}
                  className={cn(inputClass, "mt-1")}
                  value={draft.max_tokens}
                  onChange={(e) => patch({ max_tokens: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy">Context window (K tokens)</label>
                <input
                  type="number"
                  min={1}
                  className={cn(inputClass, "mt-1")}
                  value={draft.context_window_k}
                  onChange={(e) => patch({ context_window_k: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-sm font-medium text-navy">Fallback model</label>
                  <InfoTooltip text="If the primary model fails, retry with this model instead. Leave blank for no fallback (R38 — never implicit)." />
                </div>
                <input
                  className={cn(inputClass, "mt-1")}
                  placeholder="e.g. bedrock/anthropic.claude-3-5-haiku-20241022-v1:0"
                  value={draft.fallback_model_string ?? ""}
                  onChange={(e) =>
                    patch({ fallback_model_string: e.target.value || null })
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── System Prompt ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">System Prompt</h2>
        <textarea
          className={cn(inputClass, "mt-3 min-h-32")}
          value={draft.system_prompt}
          onChange={(e) => patch({ system_prompt: e.target.value })}
        />
      </section>

      {/* ── Tools ─────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">Tools</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick from the connector catalog. Manage the catalog itself on the{" "}
          <a href="/connectors" className="text-teal hover:underline">
            Connectors
          </a>{" "}
          page.
        </p>

        {connectors.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No connectors in the catalog yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {connectors.map((connector) => {
              const selected = selectedToolIds.has(connector.connector_id);
              return (
                <button
                  key={connector.connector_id}
                  type="button"
                  onClick={() => toggleTool(connector.connector_id)}
                  className={cn(
                    "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-teal bg-teal/5 ring-1 ring-teal"
                      : "border-border bg-background hover:border-teal/40",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-navy">{connector.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {connector.description}
                    </p>
                  </div>
                  {selected ? (
                    <Check size={16} className="mt-0.5 shrink-0 text-teal" />
                  ) : (
                    <Plus size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Knowledge Base ────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">Knowledge Base</h2>
          <Link to="/platform/knowledge-bases" className="text-xs text-teal hover:underline">
            Manage the library
          </Link>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a knowledge base this agent can retrieve from.
        </p>

        {knowledgeBases.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
            <Database size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No knowledge bases in the library yet.</p>
            <Link to="/platform/knowledge-bases">
              <Button size="sm" variant="outline">
                <Plus size={14} />
                Create a Knowledge Base
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => selectKnowledgeBase(null)}
              className={cn(
                "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                draft.kb_id === null
                  ? "border-teal bg-teal/5 ring-1 ring-teal"
                  : "border-border bg-background hover:border-teal/40",
              )}
            >
              <div>
                <p className="text-sm font-medium text-navy">None</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This agent doesn't use a knowledge base
                </p>
              </div>
              {draft.kb_id === null ? <Check size={16} className="mt-0.5 shrink-0 text-teal" /> : null}
            </button>

            {knowledgeBases.map((kb) => {
              const selected = draft.kb_id === kb.kb_id;
              return (
                <button
                  key={kb.kb_id}
                  type="button"
                  onClick={() => selectKnowledgeBase(kb)}
                  className={cn(
                    "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-teal bg-teal/5 ring-1 ring-teal"
                      : "border-border bg-background hover:border-teal/40",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-navy">{kb.name}</p>
                      <Badge variant={KB_STATUS_VARIANT[kb.status]}>
                        {kb.status === "INDEXING" ? "Indexing…" : kb.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{kb.description}</p>
                  </div>
                  {selected ? <Check size={16} className="mt-0.5 shrink-0 text-teal" /> : null}
                </button>
              );
            })}
          </div>
        )}

        {draft.kb_id && draft.knowledge_base ? (
          <div className="mt-4 rounded-md border border-border bg-muted/20 p-4">
            <button
              type="button"
              onClick={() => setKbAdvancedOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-teal hover:text-teal-600"
            >
              {kbAdvancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Advanced retrieval settings
            </button>

            {kbAdvancedOpen ? (
              <div className="mt-3 space-y-4 border-t border-border pt-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-navy">Chunk strategy</p>
                  <div className="flex gap-3">
                    {CHUNK_STRATEGIES.map((strategy) => (
                      <OptionCard
                        key={strategy.value}
                        icon={Sparkles}
                        label={strategy.label}
                        description={strategy.description}
                        selected={draft.knowledge_base?.chunk_strategy === strategy.value}
                        onClick={() =>
                          patchKB({
                            chunk_strategy: strategy.value as KBConfig["chunk_strategy"],
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                <Slider
                  label="Chunks retrieved per query (top K)"
                  value={draft.knowledge_base.top_k}
                  min={1}
                  max={20}
                  step={1}
                  formatValue={(v) => String(v)}
                  onChange={(v) => patchKB({ top_k: v })}
                />

                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-navy">Reranking</p>
                    <p className="text-xs text-muted-foreground">
                      Re-scores retrieved chunks for relevance before use
                    </p>
                  </div>
                  <Toggle
                    checked={draft.knowledge_base.reranking_enabled}
                    onChange={(v) => patchKB({ reranking_enabled: v })}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ── Memory ────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">Memory</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <OptionCard
            icon={X}
            label="None"
            description="Stateless — no memory between turns"
            selected={draft.memory.memory_type === "none"}
            onClick={() => patchMemory({ memory_type: "none" })}
          />
          <OptionCard
            icon={Clock}
            label="Remember this session"
            description="Cleared when the conversation ends"
            selected={draft.memory.memory_type === "session"}
            onClick={() => patchMemory({ memory_type: "session" })}
          />
          <OptionCard
            icon={Brain}
            label="Remember across sessions"
            description="Persists between conversations"
            selected={draft.memory.memory_type === "persistent"}
            onClick={() => patchMemory({ memory_type: "persistent" })}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-3 opacity-60">
          <div className="flex items-center gap-2">
            <Minimize2 size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-navy">Compress old messages</p>
              <p className="text-xs text-muted-foreground">
                Condenses old turns to save tokens
              </p>
            </div>
          </div>
          <Badge variant="secondary">Coming soon</Badge>
        </div>

        {draft.memory.memory_type === "persistent" ? (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <Slider
              label="Retention (days)"
              value={draft.memory.persistent_memory_ttl_days}
              min={1}
              max={365}
              step={1}
              formatValue={(v) => `${v}d`}
              onChange={(v) => patchMemory({ persistent_memory_ttl_days: v })}
            />
            <Slider
              label="Session turns kept in context"
              value={draft.memory.max_session_turns}
              min={1}
              max={50}
              step={1}
              formatValue={(v) => String(v)}
              onChange={(v) => patchMemory({ max_session_turns: v })}
            />
          </div>
        ) : null}
      </section>

      {/* ── Guardrails ────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">Guardrails</h2>
          <Link to="/platform/guardrail-policies" className="text-xs text-teal hover:underline">
            Manage the library
          </Link>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a policy — thresholds are admin-managed and cannot be weakened per-agent.
        </p>

        {guardrailPolicies.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
            <ShieldCheck size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No guardrail policies in the library yet.</p>
            <Link to="/platform/guardrail-policies">
              <Button size="sm" variant="outline">
                <Plus size={14} />
                Go to Guardrail Policy Library
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => selectGuardrailPolicy(null)}
              className={cn(
                "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                draft.guardrail_policy_id === null
                  ? "border-teal bg-teal/5 ring-1 ring-teal"
                  : "border-border bg-background hover:border-teal/40",
              )}
            >
              <div>
                <p className="text-sm font-medium text-navy">None</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Falls back to the baseline toggles below only
                </p>
              </div>
              {draft.guardrail_policy_id === null ? (
                <Check size={16} className="mt-0.5 shrink-0 text-teal" />
              ) : null}
            </button>

            {guardrailPolicies.map((policy) => {
              const selected = draft.guardrail_policy_id === policy.policy_id;
              return (
                <button
                  key={policy.policy_id}
                  type="button"
                  onClick={() => selectGuardrailPolicy(policy)}
                  className={cn(
                    "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-teal bg-teal/5 ring-1 ring-teal"
                      : "border-border bg-background hover:border-teal/40",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-navy">{policy.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{policy.description}</p>
                  </div>
                  {selected ? <Check size={16} className="mt-0.5 shrink-0 text-teal" /> : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 rounded-md border border-border bg-muted/20 p-4">
          <button
            type="button"
            onClick={() => setGuardrailAdvancedOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-teal hover:text-teal-600"
          >
            {guardrailAdvancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Baseline guardrails (advanced)
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Simple per-agent toggles that already exist independent of the policy library above.
          </p>

          {guardrailAdvancedOpen ? (
            <div className="mt-3 divide-y divide-border rounded-lg border border-border">
              {(
                [
                  ["prompt_injection", "Prompt injection detection", "Blocks attempts to override instructions"],
                  ["pii_detection", "PII detection", "Redacts personal data in requests"],
                  ["toxicity_filter", "Toxicity filter", "Blocks toxic or abusive input"],
                  ["hallucination_check", "Hallucination check", "Flags unsupported claims in output"],
                  ["pii_strip_output", "Strip PII from output", "Redacts personal data before returning a response"],
                ] as const
              ).map(([key, label, description]) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-navy">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Toggle
                    checked={draft.guardrails[key]}
                    onChange={(v) =>
                      patch({ guardrails: { ...draft.guardrails, [key]: v } })
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Save ──────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <label className="text-sm font-medium text-navy">
          What changed? <span className="text-muted-foreground">(saved with this version)</span>
        </label>
        <input
          className={cn(inputClass, "mt-1")}
          placeholder="e.g. Added Jira tool and enabled knowledge base"
          value={changeDescription}
          onChange={(e) => setChangeDescription(e.target.value)}
        />

        {updateMutation.isError ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Failed to save changes. Please try again.
          </div>
        ) : null}

        <div className="mt-4 flex gap-3">
          <Button
            variant="accent"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? "Saving…" : "Save New Version"}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/agents/${agentId}`)}>
            Cancel
          </Button>
        </div>
      </section>
    </div>
  );
}
