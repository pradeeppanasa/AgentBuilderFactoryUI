import { Lock } from "lucide-react";

interface StackItem {
  name: string;
  description: string;
}

const STACK: StackItem[] = [
  {
    name: "CloudWatch Logs",
    description:
      "Structured JSON logs from all agent containers. Routed via ECS log driver to your CloudWatch account.",
  },
  {
    name: "AWS X-Ray",
    description:
      "Distributed traces across agent runtime, Lambda, and Step Functions. Correlated with CloudWatch.",
  },
  {
    name: "OpenTelemetry SDK",
    description: "Spans emitted from agent runtime. Routed to your OTel collector endpoint.",
  },
];

// Always-on defaults (R45) — informational only. No toggle, no edit
// button: these are provisioned by Terraform during deployment, not
// something this settings page controls.
//
// QA U-19: this card previously said "Active" unconditionally, which reads
// as "currently receiving live telemetry right now" — misleading before
// any agent has actually been deployed (there's nothing live to receive
// yet). "Enabled" states the true, always-on fact (this happens
// automatically for every deployed agent) without claiming a live status
// this static, platform-wide settings page has no data to back up.
export function DefaultStackCard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {STACK.map((item) => (
        <div
          key={item.name}
          className="rounded-lg border border-teal/40 bg-navy p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{item.name}</p>
            <Lock size={13} className="text-white/40" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">Enabled</span>
          </div>
          <p className="mt-2 text-xs text-white/60">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
