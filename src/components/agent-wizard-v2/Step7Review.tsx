import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/common";
import { WIZARD_AGENT_TYPE_LABELS } from "@/types/agent-wizard";
import type { HitlConfig } from "@/types/hitl";
import type { TaskPlannerProposal } from "@/types/task-planner";
import type { WizardDraft } from "@/types/agent-wizard";

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

interface Step7ReviewProps {
  draft: WizardDraft;
  hitlConfig: HitlConfig;
  proposal: TaskPlannerProposal | null;
  /** Only set when this wizard session is editing an existing published
   * agent — omitted for brand-new agents, since there's nothing to diff
   * against yet. */
  previousDraft?: WizardDraft | null;
}

function DiffRow({ label, from, to }: { label: string; from: string; to: string }) {
  if (from === to) return null;
  const isNew = !from;
  return (
    <div
      className={`rounded-md px-3 py-1.5 text-xs ${
        isNew ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
      }`}
    >
      <span className="font-medium">{label}:</span>{" "}
      {isNew ? to : `${from} → ${to}`}
    </div>
  );
}

export function Step7Review({ draft, hitlConfig, proposal, previousDraft }: Step7ReviewProps) {
  const dependencyIssues: string[] = [];
  if (draft.hitl_enabled && draft.knowledge_bases.length === 0 && draft.agent_type === "rag") {
    dependencyIssues.push("RAG agent has no knowledge base attached.");
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard title="Identity">
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="inline text-muted-foreground">Name: </dt>
              <dd className="inline font-medium text-navy">{draft.name || "—"}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Type: </dt>
              <dd className="inline">{WIZARD_AGENT_TYPE_LABELS[draft.agent_type]}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Tags: </dt>
              <dd className="inline">{draft.tags.join(", ") || "none"}</dd>
            </div>
          </dl>
        </SummaryCard>

        <SummaryCard title="Persona">
          <p className="text-sm">{draft.persona_name ?? "—"} · {draft.response_tone}</p>
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
            {draft.system_prompt || "No system prompt set."}
          </p>
        </SummaryCard>

        <SummaryCard title="Resources">
          <div className="flex flex-wrap gap-1.5">
            {draft.knowledge_bases.map((k) => (
              <Badge key={k.resource_id} variant="secondary">
                KB: {k.name}
              </Badge>
            ))}
            {draft.tools.map((t) => (
              <Badge key={t.resource_id} variant="secondary">
                Tool: {t.name}
              </Badge>
            ))}
            {draft.skills.map((s) => (
              <Badge key={s.resource_id} variant="secondary">
                Skill: {s.name}
              </Badge>
            ))}
            {draft.guardrail_policy ? (
              <Badge variant="secondary">Policy: {draft.guardrail_policy.name}</Badge>
            ) : null}
            {draft.knowledge_bases.length === 0 &&
            draft.tools.length === 0 &&
            draft.skills.length === 0 &&
            !draft.guardrail_policy ? (
              <p className="text-xs text-muted-foreground">No resources attached.</p>
            ) : null}
          </div>
        </SummaryCard>

        <SummaryCard title="Model">
          <p className="text-sm">
            {draft.model_provider} · {draft.model_id}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            temperature {draft.temperature.toFixed(2)} · top-p {draft.top_p.toFixed(2)} · max{" "}
            {draft.max_tokens} tokens
          </p>
        </SummaryCard>

        <SummaryCard title="Behaviour">
          <p className="text-sm">Trigger: {draft.trigger.type}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Output: {draft.output_format} · roles: {draft.access.invoke_roles.join(", ")}
          </p>
        </SummaryCard>

        <SummaryCard title="Orchestration">
          <p className="text-sm">
            Parent: {draft.parent_orchestrator_id ?? "none"} · sub-agents:{" "}
            {draft.sub_agent_ids.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            HITL: {draft.hitl_enabled ? `on (${hitlConfig.trigger_on})` : "off"}
          </p>
        </SummaryCard>
      </div>

      <div
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
          dependencyIssues.length > 0
            ? "bg-amber-50 text-amber-800"
            : "bg-emerald-50 text-emerald-800"
        }`}
      >
        {dependencyIssues.length > 0 ? (
          <>
            <AlertTriangle size={14} />
            {dependencyIssues.join(" ")}
          </>
        ) : (
          <>
            <Check size={14} />
            All resources available.
          </>
        )}
      </div>

      {!proposal ? (
        <p className="text-xs text-muted-foreground">
          Skipped Step 1 — this configuration was filled in manually.
        </p>
      ) : null}

      {previousDraft ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Changes vs current live version
          </p>
          <div className="space-y-1.5">
            <DiffRow label="Name" from={previousDraft.name} to={draft.name} />
            <DiffRow label="System prompt" from={previousDraft.system_prompt} to={draft.system_prompt} />
            <DiffRow label="Model" from={previousDraft.model_id} to={draft.model_id} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
