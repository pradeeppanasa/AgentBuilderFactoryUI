import { useQuery } from "@tanstack/react-query";
import { listAgents } from "@/api/agents";
import { Toggle } from "@/components/common";
import { cn } from "@/lib/utils";
import type { HitlConfig } from "@/types/hitl";
import type { ExecutionMode, WizardDraft } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Step6OrchestrationProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  hitlConfig: HitlConfig;
  onHitlConfigChange: (config: HitlConfig) => void;
}

export function Step6Orchestration({
  draft,
  onChange,
  hitlConfig,
  onHitlConfigChange,
}: Step6OrchestrationProps) {
  const { data } = useQuery({ queryKey: ["agents", "list", "for-wizard"], queryFn: () => listAgents({ limit: 100 }) });
  const agents = data?.items ?? [];
  const orchestrators = agents.filter((a) => a.agent_type === "orchestrator");

  function patchHitl(patch: Partial<HitlConfig>) {
    onHitlConfigChange({ ...hitlConfig, ...patch });
  }

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Orchestration</h2>

      <div>
        <label className="text-sm font-medium text-navy">Parent orchestrator</label>
        <select
          className={cn(inputClass, "mt-1")}
          value={draft.parent_orchestrator_id ?? ""}
          onChange={(e) => onChange({ parent_orchestrator_id: e.target.value || null })}
        >
          <option value="">None — top-level agent</option>
          {orchestrators.map((o) => (
            <option key={o.agent_id} value={o.agent_id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-navy">Sub-agents this can delegate to</p>
        <div className="flex flex-wrap gap-2">
          {agents.map((a) => {
            const active = draft.sub_agent_ids.includes(a.agent_id);
            return (
              <button
                key={a.agent_id}
                type="button"
                onClick={() =>
                  onChange({
                    sub_agent_ids: active
                      ? draft.sub_agent_ids.filter((id) => id !== a.agent_id)
                      : [...draft.sub_agent_ids, a.agent_id],
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-border text-muted-foreground hover:border-teal/40",
                )}
              >
                {a.name}
              </button>
            );
          })}
          {agents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No other agents yet.</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-navy">Execution mode</label>
        <select
          className={cn(inputClass, "mt-1 w-48")}
          value={draft.execution_mode}
          onChange={(e) => onChange({ execution_mode: e.target.value as ExecutionMode })}
        >
          <option value="sequential">Sequential</option>
          <option value="parallel">Parallel</option>
        </select>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy">Human-in-the-Loop</p>
            <p className="text-xs text-muted-foreground">
              Pause for human review before certain actions complete.
            </p>
          </div>
          <Toggle checked={draft.hitl_enabled} onChange={(v) => onChange({ hitl_enabled: v })} />
        </div>

        {draft.hitl_enabled ? (
          <div className="mt-4 space-y-4 rounded-md border border-border bg-muted/20 p-4">
            <div>
              <label className="text-sm font-medium text-navy">Trigger on</label>
              <select
                className={cn(inputClass, "mt-1")}
                value={hitlConfig.trigger_on}
                onChange={(e) =>
                  patchHitl({ trigger_on: e.target.value as HitlConfig["trigger_on"] })
                }
              >
                <option value="always">Always</option>
                <option value="low_confidence">Low confidence</option>
                <option value="tool_call">Before tool call</option>
                <option value="high_risk_decision">High risk decision</option>
              </select>
            </div>

            {hitlConfig.trigger_on === "low_confidence" ? (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-navy">Confidence threshold</label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {hitlConfig.confidence_threshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={hitlConfig.confidence_threshold}
                  onChange={(e) => patchHitl({ confidence_threshold: Number(e.target.value) })}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-teal"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-navy">Reviewer role</label>
                <select
                  className={cn(inputClass, "mt-1")}
                  value={hitlConfig.reviewer_role}
                  onChange={(e) => patchHitl({ reviewer_role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-navy">Notification channel</label>
                <select
                  className={cn(inputClass, "mt-1")}
                  value={hitlConfig.notification_channel}
                  onChange={(e) =>
                    patchHitl({
                      notification_channel: e.target.value as HitlConfig["notification_channel"],
                    })
                  }
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="teams">Teams</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-navy">Timeout (hours)</label>
                <input
                  type="number"
                  className={cn(inputClass, "mt-1")}
                  value={hitlConfig.timeout_hours}
                  onChange={(e) => patchHitl({ timeout_hours: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy">Timeout action</label>
                <select
                  className={cn(inputClass, "mt-1")}
                  value={hitlConfig.timeout_action}
                  onChange={(e) =>
                    patchHitl({ timeout_action: e.target.value as HitlConfig["timeout_action"] })
                  }
                >
                  <option value="reject">Reject</option>
                  <option value="approve">Approve</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
