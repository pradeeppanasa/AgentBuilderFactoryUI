import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common";
import { Section } from "./SectionShell";
import { inputClass, selectClass } from "./formClasses";
import type { KeywordAction, KeywordPatternType, KeywordPolicy } from "@/types/guardrail-policy";

interface KeywordsSectionProps {
  value: KeywordPolicy;
  onChange: (next: KeywordPolicy) => void;
  readOnly: boolean;
}

export function KeywordsSection({ value, onChange, readOnly }: KeywordsSectionProps) {
  const [pattern, setPattern] = useState("");
  const [patternType, setPatternType] = useState<KeywordPatternType>("LITERAL");
  const [action, setAction] = useState<KeywordAction>("BLOCK");

  function addRule() {
    const trimmed = pattern.trim();
    if (!trimmed) return;
    onChange({
      rules: [...value.rules, { pattern: trimmed, pattern_type: patternType, action }],
    });
    setPattern("");
  }

  function removeRule(index: number) {
    onChange({ rules: value.rules.filter((_, i) => i !== index) });
  }

  return (
    <Section id="keywords" title="Keywords">
      <div className="flex flex-wrap gap-2">
        {value.rules.map((rule, index) => (
          <span
            key={`${rule.pattern}-${index}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              rule.action === "BLOCK"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <span className="opacity-70">[{rule.pattern_type === "LITERAL" ? "Literal" : "Regex"}]</span>
            {rule.pattern}
            <span className="opacity-70">— {rule.action === "BLOCK" ? "blocked" : "redacted"}</span>
            {!readOnly ? (
              <button type="button" onClick={() => removeRule(index)} className="hover:opacity-70">
                <X size={12} />
              </button>
            ) : null}
          </span>
        ))}
        {value.rules.length === 0 ? (
          <span className="text-xs text-muted-foreground">No keyword rules yet.</span>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
          <input
            className={`${inputClass} h-8 flex-1 text-xs`}
            placeholder="Enter keyword or pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
          <select
            className={selectClass}
            value={patternType}
            onChange={(e) => setPatternType(e.target.value as KeywordPatternType)}
          >
            <option value="LITERAL">Literal</option>
            <option value="REGEX">Regex</option>
          </select>
          <select
            className={selectClass}
            value={action}
            onChange={(e) => setAction(e.target.value as KeywordAction)}
          >
            <option value="BLOCK">Block</option>
            <option value="REDACT">Redact</option>
          </select>
          <Button type="button" size="sm" variant="outline" onClick={addRule}>
            + Add
          </Button>
        </div>
      ) : null}
    </Section>
  );
}
