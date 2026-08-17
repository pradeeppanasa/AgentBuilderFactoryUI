import type { ReactNode } from "react";
import { Badge, InfoTooltip, Slider, Toggle } from "@/components/common";
import { Section } from "./SectionShell";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { selectClass } from "./formClasses";
import {
  BERT_BLOCK_THRESHOLD_MIN,
  BERT_ESCALATE_THRESHOLD_MAX,
  BERT_STORED_ONLY_NOTES,
  type BertConfig,
} from "@/types/guardrail-policy";

interface BertSectionProps {
  value: BertConfig;
  onChange: (next: BertConfig) => void;
  readOnly: boolean;
}

function SubCheckRow({
  label,
  enabled,
  onToggle,
  readOnly,
  storedOnlyNote,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  readOnly: boolean;
  storedOnlyNote?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-navy">{label}</span>
          {storedOnlyNote ? <ComingSoonBadge note={storedOnlyNote} /> : null}
        </div>
        <Toggle checked={enabled} onChange={onToggle} disabled={readOnly} />
      </div>
      {enabled && children ? <div className="mt-3 space-y-3">{children}</div> : null}
    </div>
  );
}

export function BertSection({ value, onChange, readOnly }: BertSectionProps) {
  function patch(updates: Partial<BertConfig>) {
    onChange({ ...value, ...updates });
  }

  return (
    <Section
      id="bert"
      title="Layer 1 — BERT local screening"
      badge={<Badge variant="accent">Panasa-unique</Badge>}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy">Enabled</span>
        <Toggle checked={value.enabled} onChange={(v) => patch({ enabled: v })} disabled={readOnly} />
      </div>

      {value.enabled ? (
        <>
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Thresholds
              </p>
              <InfoTooltip text="Runs locally inside the VPC in ~50ms. Scores at or above the block threshold reject immediately with no Bedrock or LLM call." />
            </div>
            <div className="mt-3">
              <Slider
                label="Block threshold"
                value={value.block_threshold}
                min={BERT_BLOCK_THRESHOLD_MIN}
                max={1}
                step={0.01}
                disabled={readOnly}
                formatValue={(v) => v.toFixed(2)}
                onChange={(v) => patch({ block_threshold: v })}
              />
            </div>
            <div className="mt-4">
              <Slider
                label="Escalate threshold"
                value={value.escalate_threshold}
                min={0}
                max={BERT_ESCALATE_THRESHOLD_MAX}
                step={0.01}
                disabled={readOnly}
                formatValue={(v) => v.toFixed(2)}
                onChange={(v) => patch({ escalate_threshold: v })}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Admin floor: block threshold ≥ {BERT_BLOCK_THRESHOLD_MIN.toFixed(2)}, escalate
              threshold ≤ {BERT_ESCALATE_THRESHOLD_MAX.toFixed(2)}. Confidence between the two
              escalates to Layer 2 (Bedrock).
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What BERT checks (input only)
            </p>
            <div className="space-y-2">
              <SubCheckRow
                label="Toxicity"
                enabled={value.check_toxicity}
                onToggle={(v) => patch({ check_toxicity: v })}
                readOnly={readOnly}
              />

              <SubCheckRow
                label="NSFW content"
                enabled={value.check_nsfw}
                onToggle={(v) => patch({ check_nsfw: v })}
                readOnly={readOnly}
                storedOnlyNote={BERT_STORED_ONLY_NOTES.check_nsfw}
              >
                <Slider
                  label="Threshold"
                  value={value.nsfw_threshold}
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  disabled={readOnly}
                  formatValue={(v) => v.toFixed(2)}
                  onChange={(v) => patch({ nsfw_threshold: v })}
                />
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Validate</span>
                  <select
                    className={selectClass}
                    value={value.nsfw_validation}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({ nsfw_validation: e.target.value as BertConfig["nsfw_validation"] })
                    }
                  >
                    <option value="sentence">Sentence</option>
                    <option value="full_text">Full text</option>
                  </select>
                </div>
              </SubCheckRow>

              <SubCheckRow
                label="Prompt injection"
                enabled={value.check_prompt_injection}
                onToggle={(v) => patch({ check_prompt_injection: v })}
                readOnly={readOnly}
                storedOnlyNote={BERT_STORED_ONLY_NOTES.check_prompt_injection}
              >
                <Slider
                  label="Threshold"
                  value={value.prompt_injection_threshold}
                  min={0.1}
                  max={0.9}
                  step={0.01}
                  disabled={readOnly}
                  formatValue={(v) => v.toFixed(2)}
                  onChange={(v) => patch({ prompt_injection_threshold: v })}
                />
              </SubCheckRow>

              <SubCheckRow
                label="Gibberish detection"
                enabled={value.check_gibberish}
                onToggle={(v) => patch({ check_gibberish: v })}
                readOnly={readOnly}
                storedOnlyNote={BERT_STORED_ONLY_NOTES.check_gibberish}
              >
                <Slider
                  label="Threshold"
                  value={value.gibberish_threshold}
                  min={0.3}
                  max={0.9}
                  step={0.01}
                  disabled={readOnly}
                  formatValue={(v) => v.toFixed(2)}
                  onChange={(v) => patch({ gibberish_threshold: v })}
                />
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Validate</span>
                  <select
                    className={selectClass}
                    value={value.gibberish_validation}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        gibberish_validation: e.target.value as BertConfig["gibberish_validation"],
                      })
                    }
                  >
                    <option value="sentence">Sentence</option>
                    <option value="full_text">Full text</option>
                  </select>
                </div>
              </SubCheckRow>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Output does not pass through BERT. It goes directly to Layer 2 (Bedrock).
            </p>
          </div>
        </>
      ) : null}
    </Section>
  );
}
