import { Slider } from "@/components/common";
import { cn } from "@/lib/utils";
import type { WizardDraft } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function describeTemperature(v: number): string {
  if (v < 0.3) return "More precise — consistent, focused answers";
  if (v < 0.7) return "Balanced";
  return "More creative — varied, exploratory answers";
}

function describeTopP(v: number): string {
  if (v < 0.5) return "Narrow — only the most likely tokens considered";
  if (v < 0.9) return "Balanced";
  return "Broad — wider range of tokens considered";
}

interface Step4IntelligenceProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

export function Step4Intelligence({ draft, onChange }: Step4IntelligenceProps) {
  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Intelligence</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-navy">Model provider</label>
          <select
            className={cn(inputClass, "mt-1")}
            value={draft.model_provider}
            onChange={(e) =>
              onChange({ model_provider: e.target.value as WizardDraft["model_provider"] })
            }
          >
            <option value="bedrock">Bedrock</option>
            <option value="azure_openai">Azure OpenAI</option>
            <option value="self_hosted">Self-hosted</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Model ID</label>
          <input
            className={cn(inputClass, "mt-1")}
            value={draft.model_id}
            onChange={(e) => onChange({ model_id: e.target.value })}
          />
        </div>
      </div>

      <Slider
        label="Temperature"
        value={draft.temperature}
        min={0}
        max={1}
        step={0.05}
        describe={describeTemperature}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => onChange({ temperature: v })}
      />
      <Slider
        label="Top-p"
        value={draft.top_p}
        min={0}
        max={1}
        step={0.05}
        describe={describeTopP}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => onChange({ top_p: v })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-navy">Max tokens</label>
          <input
            type="number"
            className={cn(inputClass, "mt-1")}
            value={draft.max_tokens}
            onChange={(e) => onChange({ max_tokens: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Fallback model (optional)</label>
          <input
            className={cn(inputClass, "mt-1")}
            placeholder="bedrock/anthropic.claude-3-5-haiku..."
            value={draft.fallback_model_string ?? ""}
            onChange={(e) => onChange({ fallback_model_string: e.target.value || null })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <label className="text-sm font-medium text-navy">Max conversation turns</label>
          <input
            type="number"
            className={cn(inputClass, "mt-1")}
            placeholder="Unlimited"
            value={draft.max_turns ?? ""}
            onChange={(e) =>
              onChange({ max_turns: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Session timeout (minutes)</label>
          <input
            type="number"
            className={cn(inputClass, "mt-1")}
            value={draft.session_timeout_minutes}
            onChange={(e) => onChange({ session_timeout_minutes: Number(e.target.value) })}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Memory (session / long-term / summary) is configured after publish, on the agent's Edit
        page — it already has a dedicated, working picker there.
      </p>
    </section>
  );
}
