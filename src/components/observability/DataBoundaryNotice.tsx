import { ShieldCheck } from "lucide-react";

export function DataBoundaryNotice() {
  return (
    <div className="rounded-lg border-l-4 border-teal bg-navy p-5 text-white">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-teal" />
        <p className="text-sm font-semibold">R30 / R45 Compliance</p>
      </div>
      <p className="mt-2 text-sm text-white/80">
        Panasa never transmits prompts, LLM responses, tool payloads, retrieved documents,
        memory contents, or credentials through any observability channel.
      </p>
      <p className="mt-2 text-sm text-white/80">
        OTel spans contain only: agent_id, tenant_id, stage name, status code, token counts, and
        duration. Never raw content.
      </p>
      <p className="mt-2 text-sm text-white/80">
        Routing decisions for optional integrations are yours — Panasa does not control where
        your OTel collector sends data.
      </p>
    </div>
  );
}
