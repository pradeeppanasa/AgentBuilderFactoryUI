import { Badge, Toggle } from "@/components/common";
import { Section } from "./SectionShell";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { inputClass, selectClass } from "./formClasses";
import {
  BEDROCK_CREDENTIAL_STORED_ONLY_NOTE,
  BEDROCK_FILTER_LABELS,
  type BedrockContentFilters,
  type BedrockFilterConfig,
  type BedrockStrength,
} from "@/types/guardrail-policy";

const STRENGTHS: BedrockStrength[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

interface BedrockSectionProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  credentialId: string | null;
  onCredentialIdChange: (v: string | null) => void;
  guardrailId: string | null;
  guardrailVersion: string;
  filters: BedrockContentFilters;
  onFiltersChange: (next: BedrockContentFilters) => void;
  readOnly: boolean;
}

function FilterCard({
  label,
  value,
  onChange,
  readOnly,
  outputDisabled,
}: {
  label: string;
  value: BedrockFilterConfig;
  onChange: (next: BedrockFilterConfig) => void;
  readOnly: boolean;
  outputDisabled?: boolean;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-sm font-medium text-navy">{label}</p>
      <div className="mt-2 space-y-2">
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Input strength</span>
          <select
            className={selectClass}
            value={value.input_strength}
            disabled={readOnly}
            onChange={(e) => onChange({ ...value, input_strength: e.target.value as BedrockStrength })}
          >
            {STRENGTHS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Output strength</span>
          <select
            className={selectClass}
            value={value.output_strength}
            disabled={readOnly || outputDisabled}
            onChange={(e) => onChange({ ...value, output_strength: e.target.value as BedrockStrength })}
          >
            {STRENGTHS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {outputDisabled ? (
          <p className="text-[11px] text-muted-foreground">
            Output strength not applicable — prompt attacks are input-only.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function BedrockSection({
  enabled,
  onEnabledChange,
  credentialId,
  onCredentialIdChange,
  guardrailId,
  guardrailVersion,
  filters,
  onFiltersChange,
  readOnly,
}: BedrockSectionProps) {
  function patchFilter(key: keyof BedrockContentFilters, next: BedrockFilterConfig) {
    onFiltersChange({ ...filters, [key]: next });
  }

  return (
    <Section id="bedrock" title="Layer 2 — AWS Bedrock guardrails" badge={<Badge variant="secondary">AWS managed</Badge>}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy">Enabled</span>
        <Toggle checked={enabled} onChange={onEnabledChange} disabled={readOnly} />
      </div>

      {enabled ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-navy">Credential</label>
                <ComingSoonBadge note={BEDROCK_CREDENTIAL_STORED_ONLY_NOTE} />
              </div>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Reserved for future use"
                value={credentialId ?? ""}
                disabled={readOnly}
                onChange={(e) => onCredentialIdChange(e.target.value || null)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-navy">Guardrail ID</label>
              <input className={`${inputClass} mt-1`} value={guardrailId ?? "—"} disabled readOnly />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-navy">Guardrail version</label>
            <input className={`${inputClass} mt-1 w-40`} value={guardrailVersion} disabled readOnly />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Content filters
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(filters) as (keyof BedrockContentFilters)[]).map((key) => (
                <FilterCard
                  key={key}
                  label={BEDROCK_FILTER_LABELS[key]}
                  value={filters[key]}
                  onChange={(next) => patchFilter(key, next)}
                  readOnly={readOnly}
                  outputDisabled={key === "prompt_attack"}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </Section>
  );
}
