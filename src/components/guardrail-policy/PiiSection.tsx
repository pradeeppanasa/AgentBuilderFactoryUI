import { Section } from "./SectionShell";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { selectClass } from "./formClasses";
import { cn } from "@/lib/utils";
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
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pl-3 pr-3">Data type</th>
              <th className="py-2.5 pr-3">Action</th>
              <th className="py-2.5 pr-3">Applies to</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((key) => {
              const field = value[key];
              const active = field.action !== "DISABLED";
              return (
                <tr
                  key={key}
                  className={cn(
                    "border-b border-border last:border-0",
                    active ? "bg-teal/[0.03]" : undefined,
                  )}
                >
                  <td className="py-3 pl-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          active ? "bg-teal" : "bg-border",
                        )}
                        aria-hidden="true"
                      />
                      <span className={cn("font-medium", active ? "text-navy" : "text-muted-foreground")}>
                        {PII_FIELD_LABELS[key]}
                      </span>
                      {key === "date_time" ? (
                        <ComingSoonBadge note={PII_DATE_TIME_STORED_ONLY_NOTE} />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
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
                  <td className="py-3 pr-3">
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
