import { Section } from "./SectionShell";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { selectClass } from "./formClasses";
import {
  PII_DATE_TIME_STORED_ONLY_NOTE,
  PII_FIELD_LABELS,
  type PiiAction,
  type PiiConfig,
} from "@/types/guardrail-policy";

interface PiiSectionProps {
  value: PiiConfig;
  onChange: (next: PiiConfig) => void;
  readOnly: boolean;
}

export function PiiSection({ value, onChange, readOnly }: PiiSectionProps) {
  const rows = Object.keys(PII_FIELD_LABELS) as (keyof PiiConfig)[];

  return (
    <Section
      id="pii"
      title="PII protection"
      description="Applies across both Layer 1 (BERT, input only) and Layer 2 (Bedrock, input + output)."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Data type</th>
              <th className="py-2 pr-3 font-medium">Action</th>
              <th className="py-2 font-medium">Applies to</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((key) => {
              const field = value[key];
              return (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-3 text-navy">
                    <div className="flex items-center gap-2">
                      {PII_FIELD_LABELS[key]}
                      {key === "date_time" ? (
                        <ComingSoonBadge note={PII_DATE_TIME_STORED_ONLY_NOTE} />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <select
                      className={selectClass}
                      value={field.action}
                      disabled={readOnly}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          [key]: { ...field, action: e.target.value as PiiAction },
                        })
                      }
                    >
                      <option value="DISABLED">Disabled</option>
                      <option value="BLOCK">Block</option>
                      <option value="REDACT">Redact</option>
                    </select>
                  </td>
                  <td className="py-2.5">
                    <select
                      className={selectClass}
                      value={field.applies_to}
                      disabled={readOnly || field.action === "DISABLED"}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          [key]: {
                            ...field,
                            applies_to: e.target.value as "input_output" | "input_only",
                          },
                        })
                      }
                    >
                      <option value="input_output">Input + Output</option>
                      <option value="input_only">Input only</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
