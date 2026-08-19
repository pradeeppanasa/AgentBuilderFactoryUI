import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, CircleDashed, Loader2, Lock, XCircle } from "lucide-react";
import { deployAgent, generateIac, getIacStatus } from "@/api/agents";
import { Badge, Button, InfoTooltip } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotifyStore } from "@/store/useNotifyStore";
import { axiosErrorDetail, cn } from "@/lib/utils";
import type { IaCValidationReport, TerraformValidationMode } from "@/types/agent";
import type { WizardDraft } from "@/types/agent-wizard";

// U-08: generate-iac renders + validates synchronously in a single request
// — there's no real background job to observe mid-flight (see
// GET /agents/{id}/iac/status's own docstring). This animates through the
// IaC Generator's own module resolution order (CLAUDE.md Section 8) as an
// ESTIMATE of progress while the request is in flight — labelled as such
// below — rather than a literal live per-stage feed the backend can't
// honestly provide.
const EXPECTED_STAGES = [
  "Resolving modules",
  "Generating base config",
  "Generating API Gateway",
  "Generating IAM roles",
  "Generating observability",
  "Generating guardrails",
  "Running validation checks",
];

// R40: a failed generate-iac call (422) still carries the full
// IaCValidationReport as its error detail — "why did this fail" matters
// more on the failure path than the success path, so it's worth unpacking
// rather than falling back to axiosErrorDetail's generic "request failed".
function extractFailedReport(error: unknown): IaCValidationReport | null {
  if (!isAxiosError(error)) return null;
  const detail = error.response?.data?.detail;
  if (
    typeof detail === "object" &&
    detail !== null &&
    !Array.isArray(detail) &&
    Array.isArray((detail as { checks?: unknown }).checks)
  ) {
    return detail as IaCValidationReport;
  }
  return null;
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Step9PublishProps {
  agentId: string | null;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
  tested: boolean;
  onDeployed: (deploymentId: string) => void;
  // I-03: persists the current draft before generate/deploy, so both
  // always operate on what's on screen — not whatever was last saved.
  onSaveDraft: () => Promise<unknown>;
}

const MODE_OPTIONS: {
  value: TerraformValidationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "local",
    label: "Local Validation",
    description:
      "Generates the Terraform package and runs fmt/init/validate. Never contacts AWS.",
  },
  {
    value: "panasa_vpc",
    label: "Panasa VPC",
    description: "Reserved for a future stage. Still runs local validation only right now.",
  },
  {
    value: "customer_vpc",
    label: "Customer VPC",
    description: "Reserved for a future stage. Still runs local validation only right now.",
  },
];

export function Step9Publish({
  agentId,
  draft,
  onChange,
  tested,
  onDeployed,
  onSaveDraft,
}: Step9PublishProps) {
  const [validationMode, setValidationMode] = useState<TerraformValidationMode>("local");
  const [progressIndex, setProgressIndex] = useState(0);
  const role = useAuthStore((state) => state.currentUser?.role);
  const canUseExtendedModes = role === "developer" || role === "admin";
  const notify = useNotifyStore((s) => s.show);

  const iacStatusQuery = useQuery({
    queryKey: ["agents", "iac-status", agentId],
    queryFn: () => getIacStatus(agentId as string),
    enabled: !!agentId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      await onSaveDraft();
      return generateIac(agentId as string, validationMode);
    },
    onSuccess: () => {
      notify("Infrastructure generated and validated", "success");
      iacStatusQuery.refetch();
    },
    onError: () => notify("Infrastructure generation failed — see details below", "error"),
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      await onSaveDraft();
      return deployAgent(agentId as string);
    },
    onSuccess: (result) => {
      notify("Deployment started", "success");
      onDeployed(result.deployment_id);
    },
    onError: () => notify("Could not start deployment — try again", "error"),
  });

  useEffect(() => {
    if (!generateMutation.isPending) {
      setProgressIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setProgressIndex((i) => Math.min(i + 1, EXPECTED_STAGES.length - 1));
    }, 400);
    return () => window.clearInterval(interval);
  }, [generateMutation.isPending]);

  // R40: generate-iac returns 200 only once the full 11-check
  // IaCValidationReport passes — a 422 IS the "validate failed" signal, so
  // there's no separate validate call to make here.
  const validatePassed = generateMutation.isSuccess;

  return (
    <section className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">Publish</h2>

      {!agentId ? (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Save as draft in Step 8 first — publishing needs a real agent_id.
        </p>
      ) : null}

      {!tested ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Step 9 (Test) wasn't marked complete. You can still publish, but consider testing
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

      <div>
        <label className="text-sm font-medium text-navy">Validation mode</label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Local Validation is always available and never touches AWS. The other two modes are
          admin/developer-only placeholders for a future stage.
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map((option) => {
            const locked = option.value !== "local" && !canUseExtendedModes;
            if (locked) return null;
            const selected = validationMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={locked}
                onClick={() => setValidationMode(option.value)}
                className={cn(
                  "rounded-md border p-3 text-left text-xs transition-colors",
                  selected
                    ? "border-teal bg-teal/5"
                    : "border-border hover:border-teal/40",
                )}
              >
                <span className="flex items-center gap-1.5 font-medium text-navy">
                  {option.value !== "local" ? (
                    <>
                      <Lock size={12} />
                      <InfoTooltip text="Reserved for a future release — Local Validation only for now." />
                    </>
                  ) : null}
                  {option.label}
                </span>
                <span className="mt-1 block text-muted-foreground">{option.description}</span>
              </button>
            );
          })}
        </div>
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

      {!generateMutation.data &&
      !generateMutation.isPending &&
      iacStatusQuery.data &&
      iacStatusQuery.data.status !== "not_started" ? (
        <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Last generated: {iacStatusQuery.data.status} — {iacStatusQuery.data.stages.length}{" "}
          module(s). Click Generate infrastructure to refresh from the current draft.
        </p>
      ) : null}

      {generateMutation.isPending ? (
        <div className="space-y-2 rounded-md border border-border bg-muted/20 px-3 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Generating infrastructure…</span>
            <span>{Math.round(((progressIndex + 1) / EXPECTED_STAGES.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-teal transition-all duration-300"
              style={{ width: `${((progressIndex + 1) / EXPECTED_STAGES.length) * 100}%` }}
            />
          </div>
          <div className="space-y-1">
            {EXPECTED_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1.5 text-xs">
                {i < progressIndex ? (
                  <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
                ) : i === progressIndex ? (
                  <Loader2 size={12} className="shrink-0 animate-spin text-teal" />
                ) : (
                  <CircleDashed size={12} className="shrink-0 text-muted-foreground/50" />
                )}
                <span className={i <= progressIndex ? "text-navy" : "text-muted-foreground"}>
                  {stage}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Estimated — generate-iac runs as a single request, so exact stage timing isn't
            reported by the backend.
          </p>
        </div>
      ) : null}

      {generateMutation.data?.environment_note ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {generateMutation.data.environment_note}
        </p>
      ) : null}

      {generateMutation.data ? (
        <div className="flex flex-wrap gap-1.5">
          {generateMutation.data.modules.map((m) => (
            <Badge key={m} variant="secondary">
              {m}
            </Badge>
          ))}
        </div>
      ) : null}

      {(() => {
        const report =
          generateMutation.data?.validation_report ??
          (generateMutation.isError ? extractFailedReport(generateMutation.error) : null);
        if (!report) return null;
        const failedTerraformValidate = report.checks.find(
          (c) => c.name === "terraform_validate" && !c.passed,
        );
        return (
          <div className="space-y-1 rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-navy">Validation checks</p>
            {report.checks.map((check) => (
              <div key={check.name} className="flex items-start gap-1.5 text-xs">
                {check.passed ? (
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle size={13} className="mt-0.5 shrink-0 text-destructive" />
                )}
                <span>
                  <span className="font-medium text-navy">{check.name}</span>
                  {check.detail ? (
                    <span className="text-muted-foreground"> — {check.detail}</span>
                  ) : null}
                </span>
              </div>
            ))}
            {/* U-16: terraform_validate's detail is already a parsed, human-
                readable diagnostic message (never raw -json output — see
                _parse_terraform_validate_diagnostics), so no client-side
                JSON parsing belongs here. Just point the user at what to do
                next. */}
            {failedTerraformValidate ? (
              <p className="pt-1 text-[11px] text-muted-foreground">
                Fix the issue above (often the agent name/id being too long for an AWS resource
                limit), then regenerate.
              </p>
            ) : null}
          </div>
        );
      })()}

      <Button
        variant="accent"
        disabled={!validatePassed || deployMutation.isPending}
        title={!validatePassed ? "Fix validation errors before deploying" : undefined}
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
