import { useState } from "react";
import { Tabs, Toggle } from "@/components/common";
import { Playground } from "@/components/agent-detail/Playground";

const TEST_TABS = [
  { value: "chat", label: "Chat" },
  { value: "guardrail", label: "Guardrail test" },
  { value: "resource", label: "Resource test" },
];

interface Step8TestProps {
  agentId: string | null;
  tested: boolean;
  onTestedChange: (tested: boolean) => void;
}

// Section 38.6 Step 8: "Inline playground on the same page." The
// Chat/Guardrail-test/Resource-test tabs all hit the same real
// POST /agents/{id}/playground — "Guardrail test" and "Resource test" don't
// have dedicated backend endpoints, so both reuse the real Playground with
// the message box pre-filled with a representative probe (jailbreak/PII/
// banned-topic for guardrails; a KB- or tool-triggering question for
// resources) rather than inventing test-only API surface.
export function Step8Test({ agentId, tested, onTestedChange }: Step8TestProps) {
  const [activeTab, setActiveTab] = useState("chat");

  if (!agentId) {
    return (
      <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Save as draft in Step 7 first — testing needs a real agent_id to call the playground
          against.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Tabs tabs={TEST_TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === "guardrail" ? (
        <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Try known-bad inputs below — a jailbreak attempt, a message containing PII, or a
          banned-topic question. All should be blocked if the attached guardrail policy is
          configured correctly.
        </p>
      ) : null}
      {activeTab === "resource" ? (
        <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Ask a question that should require the attached knowledge base or a tool call, and
          check the metrics panel's KB retrieval / tool call sections.
        </p>
      ) : null}

      <Playground agentId={agentId} />

      <label className="flex items-center gap-2 text-sm text-navy">
        <Toggle checked={tested} onChange={onTestedChange} />
        Mark as tested
      </label>
      <p className="text-xs text-muted-foreground">
        Not mandatory — skipping shows a warning on Step 9 but won't block publishing.
      </p>
    </section>
  );
}
