import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { listKnowledgeBases } from "@/api/knowledge-bases";
import { listGuardrailPolicies } from "@/api/guardrail-policies";
import { listSkills } from "@/api/skills";
import { listConnectors } from "@/api/connectors";
import { Badge, Button } from "@/components/common";
import { cn } from "@/lib/utils";
import { ResourceSlideOver, type SlideOverKind } from "./ResourceSlideOver";
import type { WizardDraft, WizardResourceSelection } from "@/types/agent-wizard";

function ResourceGrid({
  items,
  selectedIds,
  onToggle,
  multi = true,
}: {
  items: WizardResourceSelection[];
  selectedIds: string[];
  onToggle: (item: WizardResourceSelection) => void;
  multi?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nothing in the catalog yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const selected = selectedIds.includes(item.resource_id);
        return (
          <button
            key={item.resource_id}
            type="button"
            onClick={() => onToggle(item)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md border p-2.5 text-left text-sm transition-colors",
              selected
                ? "border-teal bg-teal/5 ring-1 ring-teal"
                : "border-border hover:border-teal/40",
            )}
          >
            <span className="truncate">{item.name}</span>
            {item.isNew ? <Badge variant="success">New</Badge> : null}
          </button>
        );
      })}
      {!multi ? null : null}
    </div>
  );
}

interface Step3ResourcesProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

export function Step3Resources({ draft, onChange }: Step3ResourcesProps) {
  const [slideOver, setSlideOver] = useState<SlideOverKind | null>(null);

  const { data: kbData } = useQuery({ queryKey: ["knowledge-bases", "list"], queryFn: listKnowledgeBases });
  const { data: toolData } = useQuery({ queryKey: ["connectors", "list"], queryFn: listConnectors });
  const { data: skillData } = useQuery({ queryKey: ["skills", "list"], queryFn: listSkills });
  const { data: policyData } = useQuery({
    queryKey: ["guardrail-policies", "list"],
    queryFn: listGuardrailPolicies,
  });

  const kbItems: WizardResourceSelection[] =
    kbData?.items.map((k) => ({ resource_id: k.kb_id, name: k.name })) ?? [];
  const toolItems: WizardResourceSelection[] =
    toolData?.items.map((t) => ({ resource_id: t.connector_id, name: t.name })) ?? [];
  const skillItems: WizardResourceSelection[] =
    skillData?.items.map((s) => ({ resource_id: s.skill_id, name: s.name })) ?? [];
  const policyItems: WizardResourceSelection[] =
    policyData?.items.map((p) => ({ resource_id: p.policy_id, name: p.name })) ?? [];

  function toggleMulti(field: "knowledge_bases" | "tools" | "skills", item: WizardResourceSelection) {
    const current = draft[field];
    const exists = current.some((c) => c.resource_id === item.resource_id);
    onChange({
      [field]: exists
        ? current.filter((c) => c.resource_id !== item.resource_id)
        : [...current, item],
    } as Partial<WizardDraft>);
  }

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Resources</h2>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Knowledge bases</p>
          <Button size="sm" variant="outline" onClick={() => setSlideOver("knowledge_base")}>
            <Plus size={13} />
            Create
          </Button>
        </div>
        <ResourceGrid
          items={kbItems}
          selectedIds={draft.knowledge_bases.map((k) => k.resource_id)}
          onToggle={(item) => toggleMulti("knowledge_bases", item)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Tools</p>
          <Button size="sm" variant="outline" onClick={() => setSlideOver("tool")}>
            <Plus size={13} />
            Create
          </Button>
        </div>
        <ResourceGrid
          items={toolItems}
          selectedIds={draft.tools.map((t) => t.resource_id)}
          onToggle={(item) => toggleMulti("tools", item)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Skills</p>
          <Button size="sm" variant="outline" onClick={() => setSlideOver("skill")}>
            <Plus size={13} />
            Create
          </Button>
        </div>
        <ResourceGrid
          items={skillItems}
          selectedIds={draft.skills.map((s) => s.resource_id)}
          onToggle={(item) => toggleMulti("skills", item)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Guardrail policy</p>
          <Button size="sm" variant="outline" onClick={() => setSlideOver("guardrail_policy")}>
            <Plus size={13} />
            Create
          </Button>
        </div>
        <ResourceGrid
          items={policyItems}
          selectedIds={draft.guardrail_policy ? [draft.guardrail_policy.resource_id] : []}
          onToggle={(item) =>
            onChange({
              guardrail_policy:
                draft.guardrail_policy?.resource_id === item.resource_id ? null : item,
            })
          }
        />
      </div>

      <ResourceSlideOver
        kind={slideOver}
        onClose={() => setSlideOver(null)}
        onCreated={(selection) => {
          if (slideOver === "guardrail_policy") {
            onChange({ guardrail_policy: selection });
          } else if (slideOver === "knowledge_base") {
            onChange({ knowledge_bases: [...draft.knowledge_bases, selection] });
          } else if (slideOver === "tool") {
            onChange({ tools: [...draft.tools, selection] });
          } else if (slideOver === "skill") {
            onChange({ skills: [...draft.skills, selection] });
          }
        }}
      />
    </section>
  );
}
