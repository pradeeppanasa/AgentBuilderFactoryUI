import { Toggle } from "@/components/common";
import { cn } from "@/lib/utils";
import type { HitlConfig } from "@/types/hitl";
import type { WizardDraft } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Step7HITLProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  hitlConfig: HitlConfig;
  onHitlConfigChange: (config: HitlConfig) => void;
}

// CLAUDE.md Section 39.3 (2026-08-19, "Confirmed decision"): HITL is its own
// wizard step, not a subsection of Orchestration — it applies to Standard
// agents too (e.g. "high risk decision" review on a KYC agent with no
// sub-agents at all), so it never belonged nested under an
// orchestrator-specific step.
export function Step7HITL({ draft, onChange, hitlConfig, onHitlConfigChange }: Step7HITLProps) {
  function patchHitl(patch: Partial<HitlConfig>) {
    onHitlConfigChange({ ...hitlConfig, ...patch });
  }

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Human-in-the-Loop</h2>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy">Enable Human-in-the-Loop</p>
          <p className="text-xs text-muted-foreground">
            Pause for human review before certain actions complete.
          </p>
        </div>
        <Toggle checked={draft.hitl_enabled} onChange={(v) => onChange({ hitl_enabled: v })} />
      </div>

      {draft.hitl_enabled ? (
        <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
          <div>
            <label className="text-sm font-medium text-navy">Trigger on</label>
            <select
              className={cn(inputClass, "mt-1")}
              value={hitlConfig.trigger_on}
              onChange={(e) => patchHitl({ trigger_on: e.target.value as HitlConfig["trigger_on"] })}
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
                <option value="" disabled>
                  Select a role…
                </option>
                {/* U-06: full RBAC role set — compliance workflows (KYC/AML/fraud)
                    typically need analyst/auditor, not just admin/developer. */}
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
                <option value="analyst">Analyst</option>
                <option value="auditor">Auditor</option>
                <option value="viewer">Viewer</option>
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
    </section>
  );
}
