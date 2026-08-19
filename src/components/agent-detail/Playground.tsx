import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FlaskConical, Send, Trash2 } from "lucide-react";
import { invokePlayground } from "@/api/agents";
import { Badge, Button, InfoTooltip, Slider, Toggle } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, axiosErrorStatus, cn } from "@/lib/utils";
import type { PlaygroundChatMessage, PlaygroundMetrics } from "@/types/playground";

function formatCost(cost: number | null): string {
  return cost === null ? "—" : `$${cost.toFixed(4)}`;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}

// Right-hand metrics panel — always visible for the selected message, per
// the explicit left(chat)/right(metrics) layout ask. Values the backend
// intentionally stubs (tool_calls always [], kb_retrievals chunk_count
// always 0 — Generated Agent Runtime capabilities this Builder Runtime
// doesn't build, per app/api/v1/playground.py's own docstring) are shown
// honestly as "not yet available", not fabricated as real numbers.
function MetricsPanel({ metrics }: { metrics: PlaygroundMetrics | undefined }) {
  if (!metrics) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Send a message to see latency, tokens, cost, and guardrail decisions here.
      </div>
    );
  }

  const totalTokens =
    metrics.tokens.input_tokens !== null && metrics.tokens.output_tokens !== null
      ? metrics.tokens.input_tokens + metrics.tokens.output_tokens
      : null;

  return (
    <div className="space-y-4 p-4 text-sm">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Latency
        </p>
        <MetricRow label="Guardrail" value={`${metrics.latency.guardrail_ms}ms`} />
        <MetricRow label="Retrieval" value={`${metrics.latency.retrieval_ms}ms`} />
        <MetricRow label="LLM" value={`${metrics.latency.llm_ms}ms`} />
        <MetricRow label="Total" value={`${metrics.latency.total_ms}ms`} />
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tokens & cost
        </p>
        <MetricRow label="Input tokens" value={metrics.tokens.input_tokens?.toString() ?? "—"} />
        <MetricRow label="Output tokens" value={metrics.tokens.output_tokens?.toString() ?? "—"} />
        <MetricRow label="Total tokens" value={totalTokens?.toString() ?? "—"} />
        <MetricRow label="Estimated cost" value={formatCost(metrics.estimated_cost_usd)} />
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Guardrail decisions
        </p>
        {metrics.guardrail_decisions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No guardrail policy attached to this agent.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {metrics.guardrail_decisions.map((decision, i) => (
              <Badge
                key={i}
                variant={
                  decision.action === "block"
                    ? "destructive"
                    : decision.action === "escalate"
                      ? "warning"
                      : "success"
                }
              >
                {decision.layer}: {decision.action}
                {decision.confidence !== null
                  ? ` (${Math.round(decision.confidence * 100)}%)`
                  : ""}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tool calls
        </p>
        {metrics.tool_calls.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Not yet available — tool execution runs in the Generated Agent Runtime, a
            separate service this playground doesn't invoke.
          </p>
        ) : (
          <div className="space-y-1">
            {metrics.tool_calls.map((call, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant={call.success ? "success" : "destructive"}>{call.name}</Badge>
                <span className="text-xs">{call.duration_ms}ms</span>
                {call.cached ? (
                  <span className="text-xs text-muted-foreground">cached</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Knowledge base retrieval
        </p>
        {metrics.kb_retrievals === null ? (
          <p className="text-xs text-muted-foreground">No knowledge base attached to this agent.</p>
        ) : metrics.kb_retrievals.chunk_count === 0 ? (
          <p className="text-xs text-muted-foreground">
            Not yet available — real retrieval runs in the Generated Agent Runtime.
          </p>
        ) : (
          <MetricRow
            label="Chunks retrieved"
            value={`${metrics.kb_retrievals.chunk_count} (similarity ${metrics.kb_retrievals.similarity_scores.map((s) => s.toFixed(2)).join(", ")})`}
          />
        )}
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Memory
        </p>
        <MetricRow label="Session entries" value={String(metrics.memory.session_entries)} />
        <MetricRow
          label="Long-term entries used"
          value={String(metrics.memory.long_term_entries_used)}
        />
      </div>
    </div>
  );
}

interface PlaygroundProps {
  agentId: string;
  onSkip?: () => void;
  // U-12/U-13: lets the wizard's Guardrail-test/Resource-test tabs
  // pre-fill a representative probe message (jailbreak attempt, PII
  // string, KB-triggering question, ...) without duplicating the send/
  // metrics UI — the user still reviews and clicks Send themselves.
  presetMessage?: string | null;
}

export function Playground({ agentId, onSkip, presetMessage }: PlaygroundProps) {
  const role = useAuthStore((state) => state.currentUser?.role);
  const isAdmin = role === "admin";

  const [messages, setMessages] = useState<PlaygroundChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [lastSentMessage, setLastSentMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [disableGuardrails, setDisableGuardrails] = useState(false);
  const [temperatureOverride, setTemperatureOverride] = useState<number | null>(null);
  // U-10: lets this stage be exercised without real Bedrock credentials —
  // sends ?mock=true so the backend returns a canned response (A-02).
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    if (presetMessage) setInput(presetMessage);
  }, [presetMessage]);

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      invokePlayground(
        agentId,
        {
          message,
          session_id: sessionId,
          // Every field here is admin-only server-side (any non-default value
          // from a non-admin gets a 403) — the whole panel below is gated on
          // isAdmin so a non-admin never has a way to trigger one.
          overrides: isAdmin
            ? { disable_guardrails: disableGuardrails, temperature: temperatureOverride }
            : undefined,
        },
        mockMode,
      ),
    onSuccess: (response) => {
      setSessionId(response.session_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message,
          blocked: response.blocked,
          metrics: response.metrics,
        },
      ]);
    },
  });

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLastSentMessage(trimmed);
    sendMutation.mutate(trimmed);
  }

  function handleRetry() {
    if (!lastSentMessage || sendMutation.isPending) return;
    sendMutation.mutate(lastSentMessage);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Test the live agent configuration. Playground messages are logged separately and
          never count toward production usage.
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <InfoTooltip text="Mock mode skips the real model call and returns a canned response — useful when real provider credentials aren't configured." />
          <div className="flex rounded-md border border-border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMockMode(false)}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                !mockMode ? "bg-teal text-white" : "text-muted-foreground hover:text-navy",
              )}
            >
              Live mode
            </button>
            <button
              type="button"
              onClick={() => setMockMode(true)}
              className={cn(
                "flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors",
                mockMode ? "bg-teal text-white" : "text-muted-foreground hover:text-navy",
              )}
            >
              <FlaskConical size={12} />
              Mock mode
            </button>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex min-w-40 items-center gap-2">
            <span className="text-xs font-medium text-navy">Temperature override</span>
            <InfoTooltip text="Overrides this agent's configured temperature for playground testing only — never saved to the agent. Admin only." />
          </div>
          <div className="w-40">
            <Slider
              label=""
              value={temperatureOverride ?? 0.3}
              min={0}
              max={1}
              step={0.05}
              onChange={setTemperatureOverride}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-navy">Disable guardrails</span>
            <Toggle checked={disableGuardrails} onChange={setDisableGuardrails} />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setMessages([]);
              setSessionId(null);
            }}
          >
            <Trash2 size={14} />
            Clear memory
          </Button>
        </div>
      ) : null}

      {/* Left: chat. Right: metrics for the most recent response — the
          explicit two-column layout asked for, rather than metrics
          collapsed inline under each bubble. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex min-h-[28rem] flex-col rounded-lg border border-border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Send a message to start testing this agent.
              </p>
            ) : (
              messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div className="flex max-w-lg items-center gap-2">
                    {message.blocked ? <Badge variant="destructive">Blocked</Badge> : null}
                    <div
                      className={cn(
                        "inline-block rounded-lg px-3 py-2 text-sm",
                        message.role === "user"
                          ? "bg-teal text-white"
                          : "bg-muted/50 text-navy",
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))
            )}

            {sendMutation.isPending ? (
              <p className="text-xs text-muted-foreground">Sending…</p>
            ) : null}

            {sendMutation.isError ? (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">
                  Playground error
                  {axiosErrorStatus(sendMutation.error) !== null
                    ? ` (${axiosErrorStatus(sendMutation.error)})`
                    : ""}
                </p>
                <p>
                  {axiosErrorDetail(sendMutation.error) ??
                    "Could not reach the playground endpoint."}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={handleRetry}>
                    Retry
                  </Button>
                  {onSkip ? (
                    <Button size="sm" variant="ghost" onClick={onSkip}>
                      Skip test →
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <input
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button variant="accent" disabled={sendMutation.isPending} onClick={handleSend}>
              <Send size={16} />
              {sendMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>

        <div className="min-h-[28rem] rounded-lg border border-border bg-card">
          <MetricsPanel metrics={lastAssistantMessage?.metrics} />
        </div>
      </div>
    </div>
  );
}
