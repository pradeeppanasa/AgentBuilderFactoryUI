import { Section } from "./SectionShell";
import { inputClass, selectClass } from "./formClasses";
import { cn } from "@/lib/utils";
import {
  COMPLIANCE_FRAMEWORK_LABELS,
  type ComplianceConfig,
  type ComplianceFramework,
} from "@/types/guardrail-policy";

const FRAMEWORKS = Object.keys(COMPLIANCE_FRAMEWORK_LABELS) as ComplianceFramework[];

interface ComplianceSectionProps {
  value: ComplianceConfig;
  onChange: (next: ComplianceConfig) => void;
  readOnly: boolean;
}

export function ComplianceSection({ value, onChange, readOnly }: ComplianceSectionProps) {
  function toggleFramework(framework: ComplianceFramework) {
    if (readOnly) return;
    const active = value.frameworks.includes(framework);
    onChange({
      ...value,
      frameworks: active
        ? value.frameworks.filter((f) => f !== framework)
        : [...value.frameworks, framework],
    });
  }

  return (
    <Section id="compliance" title="Compliance frameworks">
      <div className="grid grid-cols-3 gap-2">
        {FRAMEWORKS.map((framework) => {
          const active = value.frameworks.includes(framework);
          return (
            <button
              key={framework}
              type="button"
              disabled={readOnly}
              onClick={() => toggleFramework(framework)}
              className={cn(
                "rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors disabled:cursor-not-allowed",
                active
                  ? "border-teal bg-teal/5 text-teal ring-1 ring-teal"
                  : "border-border text-muted-foreground hover:border-teal/40",
              )}
            >
              {COMPLIANCE_FRAMEWORK_LABELS[framework]}
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-sm font-medium text-navy">Custom rules</label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Plain English, one rule per line. Enforced by an LLM judge at agent-invocation time —
          this is a Generated Agent Runtime concern, not something this policy library executes.
        </p>
        <textarea
          className={`${inputClass} mt-1 h-24 resize-y`}
          value={value.custom_rules.join("\n")}
          disabled={readOnly}
          onChange={(e) =>
            onChange({
              ...value,
              custom_rules: e.target.value.split("\n").filter((line) => line.trim().length > 0),
            })
          }
        />
      </div>

      <div>
        <label className="text-sm font-medium text-navy">On compliance violation</label>
        <select
          className={`${selectClass} mt-1 w-full`}
          value={value.on_violation}
          disabled={readOnly}
          onChange={(e) =>
            onChange({ ...value, on_violation: e.target.value as ComplianceConfig["on_violation"] })
          }
        >
          <option value="stop_agent">Stop agent — show error</option>
          <option value="flag_only">Flag only — continue</option>
        </select>
      </div>
    </Section>
  );
}
