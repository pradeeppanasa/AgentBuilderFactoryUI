import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, FileCode2, Lock, Rocket, XCircle } from "lucide-react";
import {
  deleteAgent,
  deployAgent,
  generateIac,
  getAgent,
  listVersions,
} from "@/api/agents";
import { Badge, Button, LoadingSpinner, Tabs } from "@/components/common";
import { VersionTimeline } from "@/components/agent-detail/VersionTimeline";
import { DeploymentHistory } from "@/components/agent-detail/DeploymentHistory";
import { Playground } from "@/components/agent-detail/Playground";
import { RunsList } from "@/components/agent-detail/RunsList";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn } from "@/lib/utils";
import type { IaCValidationReport, TerraformValidationMode } from "@/types/agent";

// Mirrors components/agent-wizard-v2/Step9Publish.tsx's MODE_OPTIONS exactly —
// same 3 Development Terraform Validation Mode options (CLAUDE.md R46),
// same wording, so the two "Preview IaC" entry points behave identically.
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

// R40: a failed generate-iac call (422) still carries the full
// IaCValidationReport as its error detail — see Step9Publish.tsx's
// identical helper.
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

const DETAIL_TABS = [
  { value: "overview", label: "Overview" },
  { value: "runs", label: "Runs" },
  { value: "versions", label: "Version history" },
  { value: "playground", label: "Playground" },
];

export default function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";
  const [activeTab, setActiveTab] = useState("overview");
  const [validationMode, setValidationMode] = useState<TerraformValidationMode>("local");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["agents", "detail", agentId],
    queryFn: () => getAgent(agentId as string),
    enabled: Boolean(agentId),
  });

  const { data: versionsData } = useQuery({
    queryKey: ["agents", agentId, "versions"],
    queryFn: () => listVersions(agentId as string),
    enabled: Boolean(agentId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAgent(agentId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "list"] });
      navigate("/agents");
    },
  });

  const deployMutation = useMutation({
    mutationFn: () => deployAgent(agentId as string),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["agents", agentId, "deployments"] });
      navigate(`/deployments/${result.deployment_id}`);
    },
  });

  const generateIacMutation = useMutation({
    mutationFn: () => generateIac(agentId as string, validationMode),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading agent…" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Agent not found or could not be loaded.
      </div>
    );
  }

  const { agent, configuration } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-navy">{agent.name}</h1>
            <Badge variant="secondary">{agent.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {agent.agent_id} · {agent.agent_type} · v{agent.current_version}
          </p>
        </div>
        {canWrite ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateIacMutation.mutate()}
              disabled={generateIacMutation.isPending || agent.status === "DEPRECATED"}
            >
              <FileCode2 size={16} />
              {generateIacMutation.isPending ? "Generating…" : "Preview IaC"}
            </Button>
            <Button
              variant="accent"
              onClick={() => deployMutation.mutate()}
              disabled={deployMutation.isPending || agent.status === "DEPRECATED"}
            >
              <Rocket size={16} />
              {deployMutation.isPending ? "Deploying…" : "Deploy"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending || agent.status === "DEPRECATED"}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Agent"}
            </Button>
          </div>
        ) : null}
      </div>

      {canWrite ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-navy">Validation mode</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Local Validation is always available and never touches AWS. The other two modes
            are admin/developer-only placeholders for a future stage.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map((option) => {
              const locked = option.value !== "local" && !canWrite;
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
                    selected ? "border-teal bg-teal/5" : "border-border hover:border-teal/40",
                  )}
                >
                  <span className="flex items-center gap-1.5 font-medium text-navy">
                    {option.value !== "local" ? <Lock size={12} /> : null}
                    {option.label}
                  </span>
                  <span className="mt-1 block text-muted-foreground">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {deployMutation.isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Failed to trigger deployment. Please try again.
        </div>
      ) : null}

      {generateIacMutation.isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {axiosErrorDetail(generateIacMutation.error) ?? "Failed to generate IaC. Please try again."}
        </div>
      ) : null}

      {generateIacMutation.data ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-navy">
            Generated Infrastructure (v{generateIacMutation.data.version})
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Tool</dt>
              <dd className="mt-1">{generateIacMutation.data.tool}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">IaC Version</dt>
              <dd className="mt-1 font-mono text-xs">
                {generateIacMutation.data.iac_version}
              </dd>
            </div>
          </dl>
          <div className="mt-3">
            <dt className="text-muted-foreground text-sm">S3 Key</dt>
            <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {generateIacMutation.data.s3_key}
            </dd>
          </div>
          <div className="mt-3">
            <dt className="mb-1.5 text-sm text-muted-foreground">
              Terraform Modules
            </dt>
            <div className="flex flex-wrap gap-1.5">
              {generateIacMutation.data.modules.map((module) => (
                <Badge key={module} variant="secondary">
                  {module}
                </Badge>
              ))}
            </div>
          </div>

          {generateIacMutation.data.environment_note ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {generateIacMutation.data.environment_note}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* R40: a 422 still carries the full IaCValidationReport as its error
          detail — worth unpacking on the failure path, same as the success
          path, rather than just showing the generic error banner above. */}
      {(() => {
        const report =
          generateIacMutation.data?.validation_report ??
          (generateIacMutation.isError ? extractFailedReport(generateIacMutation.error) : null);
        if (!report) return null;
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
          </div>
        );
      })()}

      <Tabs tabs={DETAIL_TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === "playground" ? (
        <Playground agentId={agent.agent_id} />
      ) : null}

      {activeTab === "runs" ? (
        <RunsList agentId={agent.agent_id} canSeedDemo={canWrite} />
      ) : null}

      {activeTab === "overview" ? (
        <>
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">Overview</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Business Purpose</dt>
            <dd className="mt-1">{agent.business_purpose}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Description</dt>
            <dd className="mt-1">{agent.description}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="mt-1">
              {new Date(agent.created_at).toLocaleString()} by{" "}
              {agent.created_by}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last Updated</dt>
            <dd className="mt-1">
              {new Date(agent.updated_at).toLocaleString()} by{" "}
              {agent.updated_by}
            </dd>
          </div>
          {/* QA U-20: agent.tags is a real, always-persisted field
              (registry/models.py AgentRecord.tags) that Overview never
              rendered — the data existed, it just wasn't surfaced. */}
          <div className="col-span-2">
            <dt className="text-muted-foreground">Tags</dt>
            <dd className="mt-1">
              {Object.keys(agent.tags ?? {}).length === 0 ? (
                <span className="text-muted-foreground">No tags</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(agent.tags).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-navy"
                    >
                      {key}
                      {value ? `: ${value}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">
          Configuration (v{agent.current_version})
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Model</dt>
            <dd className="mt-1">{configuration.model_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Provider</dt>
            <dd className="mt-1">{configuration.model_provider}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Temperature</dt>
            <dd className="mt-1">{configuration.temperature}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Max Tokens</dt>
            <dd className="mt-1">{configuration.max_tokens}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <dt className="text-muted-foreground">System Prompt</dt>
          <dd className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
            {configuration.system_prompt}
          </dd>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy">
          Deployment History
        </h2>
        <DeploymentHistory agentId={agent.agent_id} />
      </div>
        </>
      ) : null}

      {activeTab === "versions" ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-navy">
            Version History
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Every save creates a new version. Rolling back to a deprecated version creates the
            next version from its config and deploys it — the version you roll back from stays
            in history, nothing is ever deleted.
          </p>
          {versionsData ? (
            <VersionTimeline
              agentId={agent.agent_id}
              currentVersion={agent.current_version}
              versions={versionsData.items}
              canWrite={canWrite}
            />
          ) : (
            <LoadingSpinner label="Loading versions…" />
          )}
        </div>
      ) : null}
    </div>
  );
}
