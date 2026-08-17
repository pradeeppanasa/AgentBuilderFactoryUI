import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createKnowledgeBase } from "@/api/knowledge-bases";
import { createGuardrailPolicy } from "@/api/guardrail-policies";
import { createSkill } from "@/api/skills";
import { createConnector } from "@/api/connectors";
import { Button, Modal } from "@/components/common";
import { axiosErrorDetail, cn } from "@/lib/utils";
import type { WizardResourceSelection } from "@/types/agent-wizard";

export type SlideOverKind = "knowledge_base" | "tool" | "skill" | "guardrail_policy";

const KIND_LABEL: Record<SlideOverKind, string> = {
  knowledge_base: "Knowledge Base",
  tool: "Tool",
  skill: "Skill",
  guardrail_policy: "Guardrail Policy",
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface ResourceSlideOverProps {
  kind: SlideOverKind | null;
  onClose: () => void;
  onCreated: (selection: WizardResourceSelection) => void;
}

// Generic inline "Create X" slide-over used by Step 1's proposal card and
// Step 3's resource pickers (Section 37.14 pattern / 38.6: "no page
// navigation, no lost state"). Each kind uses the REAL create endpoint with
// only the fields it strictly requires — everything else takes the
// backend's own defaults. Guardrail policies in particular have a large
// dedicated editor (Section 37.14); this only quick-creates a minimal
// policy the admin can refine later at /platform/guardrail-policies.
export function ResourceSlideOver({ kind, onClose, onCreated }: ResourceSlideOverProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [extra, setExtra] = useState(""); // bucket / capability+prompt / endpoint, depending on kind
  const [extra2, setExtra2] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setExtra("");
    setExtra2("");
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!kind) throw new Error("no kind");
      switch (kind) {
        case "knowledge_base": {
          const kb = await createKnowledgeBase({
            name,
            description,
            source_type: "manual",
            source_config: { content: extra },
          });
          return { resource_id: kb.kb_id, name: kb.name };
        }
        case "guardrail_policy": {
          const policy = await createGuardrailPolicy({ name, description });
          return { resource_id: policy.policy_id, name: policy.name };
        }
        case "skill": {
          const skill = await createSkill({
            name,
            description,
            capability: extra,
            prompt_fragment: extra2,
          });
          return { resource_id: skill.skill_id, name: skill.name };
        }
        case "tool": {
          const connector = await createConnector({
            name,
            description,
            executor_type: "http",
            endpoint_template: extra || undefined,
          });
          return { resource_id: connector.connector_id, name: connector.name };
        }
      }
    },
    onSuccess: (selection) => {
      onCreated({ ...selection, isNew: true });
      reset();
      onClose();
    },
    onError: (err) => setError(axiosErrorDetail(err) ?? "Failed to create."),
  });

  if (!kind) return null;

  return (
    <Modal
      open={Boolean(kind)}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Create ${KIND_LABEL[kind]}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            disabled={mutation.isPending || !name || !description}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating…" : "Create"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-navy">Name</label>
          <input
            className={cn(inputClass, "mt-1")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Description</label>
          <textarea
            className={cn(inputClass, "mt-1 h-16 resize-y")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {kind === "knowledge_base" ? (
          <div>
            <label className="text-sm font-medium text-navy">Content</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Quick-create uses manual entry. Switch source type later in the KB library.
            </p>
            <textarea
              className={cn(inputClass, "mt-1 h-24 resize-y")}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            />
          </div>
        ) : null}

        {kind === "tool" ? (
          <div>
            <label className="text-sm font-medium text-navy">Endpoint URL (optional)</label>
            <input
              className={cn(inputClass, "mt-1")}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
          </div>
        ) : null}

        {kind === "skill" ? (
          <>
            <div>
              <label className="text-sm font-medium text-navy">Capability</label>
              <input
                className={cn(inputClass, "mt-1")}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Prompt fragment</label>
              <textarea
                className={cn(inputClass, "mt-1 h-20 resize-y")}
                value={extra2}
                onChange={(e) => setExtra2(e.target.value)}
              />
            </div>
          </>
        ) : null}

        {kind === "guardrail_policy" ? (
          <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Creates a policy with default settings (BERT + Bedrock content filters). Refine
            thresholds, PII rules, and topics later in the Guardrail Policy Library.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
        ) : null}
      </div>
    </Modal>
  );
}
