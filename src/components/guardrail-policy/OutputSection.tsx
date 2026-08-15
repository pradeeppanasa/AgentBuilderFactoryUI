import { Section } from "./SectionShell";
import { inputClass } from "./formClasses";
import type { BlockedMessages } from "@/types/guardrail-policy";

interface OutputSectionProps {
  value: BlockedMessages;
  onChange: (next: BlockedMessages) => void;
  readOnly: boolean;
}

export function OutputSection({ value, onChange, readOnly }: OutputSectionProps) {
  return (
    <Section id="output" title="Blocked messages">
      <div>
        <label className="text-sm font-medium text-navy">Content blocked message</label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Shown when Layer 1 or Layer 2 blocks input or output.
        </p>
        <input
          className={`${inputClass} mt-1`}
          value={value.content_blocked}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, content_blocked: e.target.value })}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-navy">Compliance blocked message</label>
        <p className="mt-0.5 text-xs text-muted-foreground">Shown when a compliance rule fires.</p>
        <input
          className={`${inputClass} mt-1`}
          value={value.compliance_blocked}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, compliance_blocked: e.target.value })}
        />
      </div>
    </Section>
  );
}
