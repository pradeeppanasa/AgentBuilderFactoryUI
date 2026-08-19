import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/common";
import { WIZARD_AGENT_TYPE_LABELS } from "@/types/agent-wizard";
import type { HitlConfig } from "@/types/hitl";
import type { TaskPlannerResponse } from "@/types/task-planner";
import type { WizardCreationMode, WizardDraft } from "@/types/agent-wizard";

const CREATION_MODE_LABELS: Record<WizardCreationMode, string> = {
  simple: "Simple Agent",
  orchestrator: "Orchestrator Setup",
  build_with_ai: "Build with AI",
};

const HITL_TRIGGER_LABELS: Record<HitlConfig["trigger_on"], string> = {
  always: "Always",
  low_confidence: "Low confidence",
  tool_call: "Before tool call",
  high_risk_decision: "High risk decision",
};

const HITL_TIMEOUT_ACTION_LABELS: Record<HitlConfig["timeout_action"], string> = {
  reject: "Reject",
  approve: "Approve",
};

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
  onChange: (patch: Partial<WizardDraft>) => void;
  hitlConfig: HitlConfig;
  proposal: TaskPlannerResponse | null;
  creationMode: WizardCreationMode;
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

export function Step7Review({
  draft,
  onChange,
  hitlConfig,
  proposal,
  creationMode,
  previousDraft,
}: Step7ReviewProps) {
  const dependencyIssues: string[] = [];
  if (draft.agent_type === "orchestrator" && draft.sub_agent_ids.length === 0) {
    dependencyIssues.push("Orchestrator has no sub-agents attached yet.");
  }

  return (
    <section className="space-y-4">
      {/* QA U-21 fix: this step's "Save as draft" / "Proceed to test"
          button is what actually mints v1/v2 (AgentWizard.tsx's
          saveMutation) — the Changelog field previously lived only on
          Step 9 (Publish), which the user hadn't reached yet, so every
          early version was stamped with a generic fallback message
          instead of real user-authored text. Still editable again on
          Step 9 before the final publish. */}
      <div className="rounded-lg border border-border bg-card p-4">
        <label className="text-sm font-medium text-navy">Change description</label>
        <p className="mb-1.5 mt-0.5 text-xs text-muted-foreground">
          What's new or changed in this version — saved with the version you're about to create.
        </p>
        <textarea
          className="h-16 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g. Added Companies House tool and updated system prompt"
          value={draft.changelog}
          onChange={(e) => onChange({ changelog: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SummaryCard title="Identity">
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="inline text-muted-foreground">Name: </dt>
              <dd className="inline font-medium text-navy">{draft.name || "—"}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Role: </dt>
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
          {draft.hitl_enabled ? (
            <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                HITL
              </p>
              <div>
                <dt className="inline">Trigger: </dt>
                <dd className="inline text-navy">{HITL_TRIGGER_LABELS[hitlConfig.trigger_on]}</dd>
              </div>
              {hitlConfig.trigger_on === "low_confidence" ? (
                <div>
                  <dt className="inline">Threshold: </dt>
                  <dd className="inline text-navy">{hitlConfig.confidence_threshold.toFixed(2)}</dd>
                </div>
              ) : null}
              <div>
                <dt className="inline">Reviewer role: </dt>
                <dd className="inline text-navy">{hitlConfig.reviewer_role}</dd>
              </div>
              <div>
                <dt className="inline">Notification: </dt>
                <dd className="inline text-navy capitalize">{hitlConfig.notification_channel}</dd>
              </div>
              <div>
                <dt className="inline">Timeout: </dt>
                <dd className="inline text-navy">{hitlConfig.timeout_hours} hours</dd>
              </div>
              <div>
                <dt className="inline">Timeout action: </dt>
                <dd className="inline text-navy">
                  {HITL_TIMEOUT_ACTION_LABELS[hitlConfig.timeout_action]}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">HITL: off</p>
          )}
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

      <p className="text-xs text-muted-foreground">
        Creation mode: {CREATION_MODE_LABELS[creationMode]}
        {!proposal && creationMode === "build_with_ai"
          ? " — no proposal was generated; this configuration was filled in manually."
          : ""}
      </p>

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
