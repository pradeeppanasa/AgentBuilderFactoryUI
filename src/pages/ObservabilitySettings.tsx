import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getObservabilityConfig,
  saveDatadogConfig,
  saveLangfuseConfig,
} from "@/api/observability";
import { Button, LoadingSpinner } from "@/components/common";
import { DataBoundaryNotice } from "@/components/observability/DataBoundaryNotice";
import { DefaultStackCard } from "@/components/observability/DefaultStackCard";
import { IntegrationCard } from "@/components/observability/IntegrationCard";
import { OtelEndpointForm } from "@/components/observability/OtelEndpointForm";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn } from "@/lib/utils";
import { DATADOG_SITES, type DatadogSite } from "@/types/observability";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const QUERY_KEY = ["admin", "settings", "observability"];

export default function ObservabilitySettings() {
  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getObservabilityConfig,
  });

  // Local, un-masked drafts for the secret fields — the GET response only
  // ever returns "****"/null for secret_key and api_key (never the real
  // value), so these start empty and are only sent on Save if the admin
  // actually typed something new.
  const [langfuseEnabled, setLangfuseEnabled] = useState(false);
  const [langfusePublicKey, setLangfusePublicKey] = useState("");
  const [langfuseSecretKey, setLangfuseSecretKey] = useState("");
  const [langfuseHost, setLangfuseHost] = useState("");

  const [datadogEnabled, setDatadogEnabled] = useState(false);
  const [datadogApiKey, setDatadogApiKey] = useState("");
  const [datadogSite, setDatadogSite] = useState<DatadogSite>("datadoghq.com");

  useEffect(() => {
    if (!data) return;
    setLangfuseEnabled(data.langfuse.enabled);
    setLangfusePublicKey(data.langfuse.public_key ?? "");
    setLangfuseHost(data.langfuse.host ?? "");
    setDatadogEnabled(data.datadog.enabled);
    setDatadogSite(data.datadog.site ?? "datadoghq.com");
  }, [data]);

  const langfuseMutation = useMutation({
    mutationFn: () =>
      saveLangfuseConfig({
        enabled: langfuseEnabled,
        public_key: langfusePublicKey || undefined,
        secret_key: langfuseSecretKey || undefined,
        host: langfuseHost || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEY, (prev: typeof data) =>
        prev ? { ...prev, langfuse: updated } : prev,
      );
      setLangfuseSecretKey("");
    },
  });

  const datadogMutation = useMutation({
    mutationFn: () =>
      saveDatadogConfig({
        enabled: datadogEnabled,
        api_key: datadogApiKey || undefined,
        site: datadogSite,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEY, (prev: typeof data) =>
        prev ? { ...prev, datadog: updated } : prev,
      );
      setDatadogApiKey("");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Observability &amp; Tracing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Panasa emits OpenTelemetry spans from the agent runtime. CloudWatch and X-Ray are
          always active. Configure optional integrations below — data is routed through your
          own OTel collector, never through Panasa.
        </p>
      </div>

      {isLoading ? <LoadingSpinner label="Loading observability settings…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load observability settings. This endpoint isn't implemented in the Factory
          Runtime yet — /admin/settings/observability isn't wired up server-side.
        </div>
      ) : null}

      <div>
        <DefaultStackCard />
        <p className="mt-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          These components are provisioned automatically by Terraform during agent deployment.
          They require no configuration here.
        </p>
      </div>

      {data ? (
        <OtelEndpointForm
          initialEndpoint={data.otel.endpoint}
          canWrite={canWrite}
          onSaved={(endpoint) =>
            queryClient.setQueryData(QUERY_KEY, (prev: typeof data) =>
              prev ? { ...prev, otel: { endpoint } } : prev,
            )
          }
        />
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-navy">Optional Integrations</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          These are customer-controlled. Panasa does not send data to these services directly —
          you route your OTel collector output to them.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <IntegrationCard
            title="Langfuse"
            description="Connect Langfuse for LLM observability, prompt tracing, and evaluation. Requires your own Langfuse instance (self-hosted or Langfuse Cloud)."
            enabled={langfuseEnabled}
            disabled={!canWrite}
            onToggle={setLangfuseEnabled}
            footer={
              <>
                <Button
                  size="sm"
                  variant="accent"
                  disabled={!canWrite || langfuseMutation.isPending}
                  onClick={() => langfuseMutation.mutate()}
                >
                  {langfuseMutation.isPending ? "Saving…" : "Save"}
                </Button>
                {langfuseMutation.isError ? (
                  <p className="mt-2 text-xs text-destructive">
                    {axiosErrorDetail(langfuseMutation.error) ?? "Failed to save Langfuse settings."}
                  </p>
                ) : null}
                {langfuseMutation.isSuccess ? (
                  <p className="mt-2 text-xs text-emerald-700">Langfuse settings saved.</p>
                ) : null}
              </>
            }
          >
            <div>
              <label className="text-xs font-medium text-navy">Public Key</label>
              <input
                className={cn(inputClass, "mt-1")}
                value={langfusePublicKey}
                disabled={!canWrite}
                onChange={(e) => setLangfusePublicKey(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-navy">Secret Key</label>
              <input
                type="password"
                className={cn(inputClass, "mt-1")}
                placeholder={data?.langfuse.secret_key ? "•••• (unchanged)" : ""}
                value={langfuseSecretKey}
                disabled={!canWrite}
                onChange={(e) => setLangfuseSecretKey(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-navy">Host URL</label>
              <input
                className={cn(inputClass, "mt-1")}
                placeholder="https://cloud.langfuse.com"
                value={langfuseHost}
                disabled={!canWrite}
                onChange={(e) => setLangfuseHost(e.target.value)}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="Datadog"
            description="Route OTel spans to Datadog APM. Configure your OTel collector to export to Datadog's endpoint, then enter your API key here for metadata tagging."
            enabled={datadogEnabled}
            disabled={!canWrite}
            onToggle={setDatadogEnabled}
            footer={
              <>
                <Button
                  size="sm"
                  variant="accent"
                  disabled={!canWrite || datadogMutation.isPending}
                  onClick={() => datadogMutation.mutate()}
                >
                  {datadogMutation.isPending ? "Saving…" : "Save"}
                </Button>
                {datadogMutation.isError ? (
                  <p className="mt-2 text-xs text-destructive">
                    {axiosErrorDetail(datadogMutation.error) ?? "Failed to save Datadog settings."}
                  </p>
                ) : null}
                {datadogMutation.isSuccess ? (
                  <p className="mt-2 text-xs text-emerald-700">Datadog settings saved.</p>
                ) : null}
              </>
            }
          >
            <div>
              <label className="text-xs font-medium text-navy">API Key</label>
              <input
                type="password"
                className={cn(inputClass, "mt-1")}
                placeholder={data?.datadog.api_key ? "•••• (unchanged)" : ""}
                value={datadogApiKey}
                disabled={!canWrite}
                onChange={(e) => setDatadogApiKey(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-navy">Site</label>
              <select
                className={cn(inputClass, "mt-1")}
                value={datadogSite}
                disabled={!canWrite}
                onChange={(e) => setDatadogSite(e.target.value as DatadogSite)}
              >
                {DATADOG_SITES.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
          </IntegrationCard>
        </div>
      </div>

      <DataBoundaryNotice />
    </div>
  );
}
