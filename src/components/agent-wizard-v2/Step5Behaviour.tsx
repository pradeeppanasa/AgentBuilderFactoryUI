import { cn } from "@/lib/utils";
import type { AccessConfig, TriggerConfig, TriggerType } from "@/types/agent-wizard";
import type { WizardDraft } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ROLES = ["admin", "developer", "analyst", "auditor", "viewer"];

interface Step5BehaviourProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

export function Step5Behaviour({ draft, onChange }: Step5BehaviourProps) {
  function patchTrigger(patch: Partial<TriggerConfig>) {
    onChange({ trigger: { ...draft.trigger, ...patch } });
  }
  function patchAccess(patch: Partial<AccessConfig>) {
    onChange({ access: { ...draft.access, ...patch } });
  }

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Behaviour</h2>

      <div>
        <label className="text-sm font-medium text-navy">Trigger type</label>
        <select
          className={cn(inputClass, "mt-1")}
          value={draft.trigger.type}
          onChange={(e) => patchTrigger({ type: e.target.value as TriggerType })}
        >
          <option value="on_demand">On-demand</option>
          <option value="scheduled">Scheduled</option>
          <option value="webhook">Webhook</option>
          <option value="step_function">Step Function</option>
        </select>
      </div>

      {draft.trigger.type === "scheduled" ? (
        <div>
          <label className="text-sm font-medium text-navy">Cron expression (UTC)</label>
          <input
            className={cn(inputClass, "mt-1 font-mono")}
            placeholder="0 9 * * MON-FRI"
            value={draft.trigger.cron_expression ?? ""}
            onChange={(e) => patchTrigger({ cron_expression: e.target.value || null })}
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-navy">Output format</label>
        <select
          className={cn(inputClass, "mt-1")}
          value={draft.output_format}
          onChange={(e) =>
            onChange({ output_format: e.target.value as WizardDraft["output_format"] })
          }
        >
          <option value="text">Text</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
          <option value="structured">Structured</option>
        </select>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium text-navy">Who can invoke</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => {
            const active = draft.access.invoke_roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() =>
                  patchAccess({
                    invoke_roles: active
                      ? draft.access.invoke_roles.filter((r) => r !== role)
                      : [...draft.access.invoke_roles, role],
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-border text-muted-foreground hover:border-teal/40",
                )}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-navy">Rate limit (rpm)</label>
          <input
            type="number"
            className={cn(inputClass, "mt-1")}
            placeholder="Unlimited"
            value={draft.access.rate_limit_rpm ?? ""}
            onChange={(e) =>
              patchAccess({ rate_limit_rpm: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Rate limit (rpd)</label>
          <input
            type="number"
            className={cn(inputClass, "mt-1")}
            placeholder="Unlimited"
            value={draft.access.rate_limit_rpd ?? ""}
            onChange={(e) =>
              patchAccess({ rate_limit_rpd: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Monthly budget (USD)</label>
          <input
            type="number"
            className={cn(inputClass, "mt-1")}
            placeholder="Unlimited"
            value={draft.access.monthly_budget_usd ?? ""}
            onChange={(e) =>
              patchAccess({
                monthly_budget_usd: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>
      </div>
    </section>
  );
}
