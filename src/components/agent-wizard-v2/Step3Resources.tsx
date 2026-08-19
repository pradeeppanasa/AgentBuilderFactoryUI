import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Plus, Square } from "lucide-react";
import { listKnowledgeBases } from "@/api/knowledge-bases";
import { listGuardrailPolicies } from "@/api/guardrail-policies";
import { listSkills } from "@/api/skills";
import { listConnectors } from "@/api/connectors";
import { listAgents } from "@/api/agents";
import { Badge, Button } from "@/components/common";
import { cn } from "@/lib/utils";
import { ResourceSlideOver, type SlideOverKind } from "./ResourceSlideOver";
import type { WizardDraft, WizardResourceSelection } from "@/types/agent-wizard";

// U-02: a checkbox icon (checked/unchecked) makes select-vs-open unambiguous
// — plain highlighted-border chips left it unclear whether clicking selects
// or navigates.
function ResourceGrid({
  items,
  selectedIds,
  onToggle,
}: {
  items: WizardResourceSelection[];
  selectedIds: string[];
  onToggle: (item: WizardResourceSelection) => void;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nothing in the catalog yet — create your first one.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const selected = selectedIds.includes(item.resource_id);
        return (
          <button
            key={item.resource_id}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(item)}
            className={cn(
              "flex items-center gap-2 rounded-md border p-2.5 text-left text-sm transition-colors",
              selected
                ? "border-teal bg-teal/5 ring-1 ring-teal"
                : "border-border hover:border-teal/40",
            )}
          >
            {selected ? (
              <CheckSquare size={15} className="shrink-0 text-teal" />
            ) : (
              <Square size={15} className="shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 truncate">{item.name}</span>
            {item.isNew ? <Badge variant="success">New</Badge> : null}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({
  title,
  selectedCount,
  onCreate,
}: {
  title: string;
  selectedCount: number;
  onCreate: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-navy">{title}</p>
        <span className="text-xs text-muted-foreground">
          {selectedCount} selected
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={onCreate}>
        <Plus size={13} />
        Create
      </Button>
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
  const isOrchestrator = draft.agent_type === "orchestrator";
  const { data: agentData } = useQuery({
    queryKey: ["agents", "list", "for-wizard"],
    queryFn: () => listAgents({ limit: 100 }),
    enabled: isOrchestrator,
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
        <SectionHeader
          title="Knowledge bases"
          selectedCount={draft.knowledge_bases.length}
          onCreate={() => setSlideOver("knowledge_base")}
        />
        <ResourceGrid
          items={kbItems}
          selectedIds={draft.knowledge_bases.map((k) => k.resource_id)}
          onToggle={(item) => toggleMulti("knowledge_bases", item)}
        />
      </div>

      <div>
        <SectionHeader
          title="Tools"
          selectedCount={draft.tools.length}
          onCreate={() => setSlideOver("tool")}
        />
        <ResourceGrid
          items={toolItems}
          selectedIds={draft.tools.map((t) => t.resource_id)}
          onToggle={(item) => toggleMulti("tools", item)}
        />
      </div>

      <div>
        <SectionHeader
          title="Skills"
          selectedCount={draft.skills.length}
          onCreate={() => setSlideOver("skill")}
        />
        <ResourceGrid
          items={skillItems}
          selectedIds={draft.skills.map((s) => s.resource_id)}
          onToggle={(item) => toggleMulti("skills", item)}
        />
      </div>

      <div>
        <SectionHeader
          title="Guardrail policy"
          selectedCount={draft.guardrail_policy ? 1 : 0}
          onCreate={() => setSlideOver("guardrail_policy")}
        />
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

      {isOrchestrator ? (
        <div>
          <p className="mb-2 text-sm font-medium text-navy">Sub-agents</p>
          <div className="flex flex-wrap gap-2">
            {(agentData?.items ?? []).map((a) => {
              const active = draft.sub_agent_ids.includes(a.agent_id);
              return (
                <button
                  key={a.agent_id}
                  type="button"
                  onClick={() =>
                    onChange({
                      sub_agent_ids: active
                        ? draft.sub_agent_ids.filter((id) => id !== a.agent_id)
                        : [...draft.sub_agent_ids, a.agent_id],
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-teal bg-teal/10 text-teal"
                      : "border-border text-muted-foreground hover:border-teal/40",
                  )}
                >
                  {a.name} · {a.agent_type} · {a.status.toLowerCase()}
                </button>
              );
            })}
          </div>
          {(agentData?.items.length ?? 0) === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No agents yet? Create standard agents first, then attach them here.
            </p>
          ) : null}
        </div>
      ) : null}

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
