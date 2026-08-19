import { useQuery } from "@tanstack/react-query";
import { listAgents } from "@/api/agents";
import { cn } from "@/lib/utils";
import type { ExecutionMode, WizardDraft } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Step6OrchestrationProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

// HITL moved to its own Step 7 (CLAUDE.md Section 39.3, 2026-08-19) — it
// isn't an orchestration-only concern (a Standard agent can need human
// review just as much as an Orchestrator), so this step is now purely
// about delegation: parent orchestrator + execution mode. Sub-agent
// selection itself lives in Step 3's Resources (Sub-agents section).
export function Step6Orchestration({ draft, onChange }: Step6OrchestrationProps) {
  const { data } = useQuery({ queryKey: ["agents", "list", "for-wizard"], queryFn: () => listAgents({ limit: 100 }) });
  const agents = data?.items ?? [];
  const orchestrators = agents.filter((a) => a.agent_type === "orchestrator");

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

      <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Sub-agents this agent delegates to are configured in Step 3's Sub-agents section
        ({draft.sub_agent_ids.length} attached).
      </p>

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
    </section>
  );
}
