import { X } from "lucide-react";
import { OptionCard } from "@/components/common";
import { Bot, MessageSquare, Search, Workflow, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_AGENT_TYPE_LABELS, type WizardAgentType, type WizardDraft } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const AGENT_TYPE_ICONS: Record<WizardAgentType, typeof Bot> = {
  standard: Bot,
  orchestrator: Workflow,
  task_planner: Search,
  rag: MessageSquare,
  tool_executor: Wrench,
};

interface Step2IdentityProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

export function Step2Identity({ draft, onChange }: Step2IdentityProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Identity and Persona</h2>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-navy">Agent name</label>
          <input
            className={cn(inputClass, "mt-1")}
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Persona name</label>
          <input
            className={cn(inputClass, "mt-1")}
            placeholder="What the agent calls itself (optional)"
            value={draft.persona_name ?? ""}
            onChange={(e) => onChange({ persona_name: e.target.value || null })}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-navy">Description</label>
        <input
          className={cn(inputClass, "mt-1")}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          required
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-navy">Agent type</p>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(WIZARD_AGENT_TYPE_LABELS) as WizardAgentType[]).map((type) => (
            <OptionCard
              key={type}
              icon={AGENT_TYPE_ICONS[type]}
              label={WIZARD_AGENT_TYPE_LABELS[type]}
              selected={draft.agent_type === type}
              onClick={() => onChange({ agent_type: type })}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-navy">Tags</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {draft.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange({ tags: draft.tags.filter((t) => t !== tag) })}
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            className="h-7 w-32 rounded-md border border-dashed border-border bg-background px-2 text-xs focus-visible:outline-none"
            placeholder="+ tag, Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const value = e.currentTarget.value.trim();
                if (value && !draft.tags.includes(value)) {
                  onChange({ tags: [...draft.tags, value] });
                }
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-navy">System prompt</label>
        <textarea
          className={cn(inputClass, "mt-1 h-36 resize-y")}
          value={draft.system_prompt}
          onChange={(e) => onChange({ system_prompt: e.target.value })}
          required
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-navy">Greeting message</label>
          <input
            className={cn(inputClass, "mt-1")}
            placeholder="First message shown to users (optional)"
            value={draft.greeting_message ?? ""}
            onChange={(e) => onChange({ greeting_message: e.target.value || null })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Response tone</label>
          <select
            className={cn(inputClass, "mt-1")}
            value={draft.response_tone}
            onChange={(e) =>
              onChange({ response_tone: e.target.value as WizardDraft["response_tone"] })
            }
          >
            <option value="formal">Formal</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
          </select>
        </div>
      </div>
    </section>
  );
}
