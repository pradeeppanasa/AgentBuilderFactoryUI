import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { generateIac, deployAgent } from "@/api/agents";
import { Badge, Button } from "@/components/common";
import { axiosErrorDetail, cn } from "@/lib/utils";
import type { WizardDraft } from "@/types/agent-wizard";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Step9PublishProps {
  agentId: string | null;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  tested: boolean;
  onDeployed: (deploymentId: string) => void;
}

export function Step9Publish({ agentId, draft, onChange, tested, onDeployed }: Step9PublishProps) {
  const generateMutation = useMutation({
    mutationFn: () => generateIac(agentId as string),
  });

  const deployMutation = useMutation({
    mutationFn: () => deployAgent(agentId as string),
    onSuccess: (result) => onDeployed(result.deployment_id),
  });

  // R40: generate-iac returns 200 only once the full 8-check
  // IaCValidationReport passes — a 422 IS the "validate failed" signal, so
  // there's no separate validate call to make here.
  const validatePassed = generateMutation.isSuccess;

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Publish</h2>

      {!agentId ? (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Save as draft in Step 7 first — publishing needs a real agent_id.
        </p>
      ) : null}

      {!tested ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Step 8 (Test) wasn't marked complete. You can still publish, but consider testing
          first.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-navy">Version label</label>
          <input
            className={cn(inputClass, "mt-1")}
            value={draft.version_label}
            onChange={(e) => onChange({ version_label: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-navy">Changelog</label>
        <textarea
          className={cn(inputClass, "mt-1 h-20 resize-y")}
          placeholder="What's new or changed in this version"
          value={draft.changelog}
          onChange={(e) => onChange({ changelog: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          disabled={!agentId || generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          {generateMutation.isPending ? "Generating…" : "Generate infrastructure"}
        </Button>

        {generateMutation.isSuccess ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 size={15} />
            terraform validate passed — {generateMutation.data.modules.length} modules
          </span>
        ) : null}
        {generateMutation.isError ? (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <XCircle size={15} />
            {axiosErrorDetail(generateMutation.error) ?? "Validation failed."}
          </span>
        ) : null}
      </div>

      {generateMutation.data ? (
        <div className="flex flex-wrap gap-1.5">
          {generateMutation.data.modules.map((m) => (
            <Badge key={m} variant="secondary">
              {m}
            </Badge>
          ))}
        </div>
      ) : null}

      <Button
        variant="accent"
        disabled={!validatePassed || deployMutation.isPending}
        onClick={() => deployMutation.mutate()}
      >
        {deployMutation.isPending ? "Deploying…" : "Deploy"}
      </Button>

      {deployMutation.isError ? (
        <p className="text-xs text-destructive">
          {axiosErrorDetail(deployMutation.error) ?? "Deploy failed."}
        </p>
      ) : null}
    </section>
  );
}
