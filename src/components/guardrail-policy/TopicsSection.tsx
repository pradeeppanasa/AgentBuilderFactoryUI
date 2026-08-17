import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common";
import { Section } from "./SectionShell";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { inputClass } from "./formClasses";
import { TOPICS_ALLOWED_STORED_ONLY_NOTE, type TopicConfig } from "@/types/guardrail-policy";

function TagInput({
  tags,
  onChange,
  variant,
  placeholder,
  readOnly,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  variant: "red" | "green";
  placeholder: string;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const trimmed = draft.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setDraft("");
  }

  const chipClass =
    variant === "red"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${chipClass}`}
          >
            {tag}
            {!readOnly ? (
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            ) : null}
          </span>
        ))}
        {tags.length === 0 ? <span className="text-xs text-muted-foreground">None</span> : null}
      </div>
      {!readOnly ? (
        <div className="mt-2 flex gap-2">
          <input
            className={`${inputClass} h-8 flex-1 text-xs`}
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" size="sm" variant="outline" onClick={addTag}>
            + Add topic
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface TopicsSectionProps {
  value: TopicConfig;
  onChange: (next: TopicConfig) => void;
  readOnly: boolean;
}

export function TopicsSection({ value, onChange, readOnly }: TopicsSectionProps) {
  return (
    <Section id="topics" title="Topics">
      <div>
        <p className="text-sm font-medium text-navy">Banned topics</p>
        <div className="mt-2">
          <TagInput
            tags={value.banned_topics}
            onChange={(banned_topics) => onChange({ ...value, banned_topics })}
            variant="red"
            placeholder="e.g. system configuration"
            readOnly={readOnly}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-navy">Allowed topics</p>
          <ComingSoonBadge note={TOPICS_ALLOWED_STORED_ONLY_NOTE} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Leave empty to allow all topics. Add topics to restrict the agent to only these
          subjects.
        </p>
        <div className="mt-2">
          <TagInput
            tags={value.allowed_topics ?? []}
            onChange={(list) => onChange({ ...value, allowed_topics: list.length ? list : null })}
            variant="green"
            placeholder="e.g. billing questions"
            readOnly={readOnly}
          />
        </div>
      </div>
    </Section>
  );
}
