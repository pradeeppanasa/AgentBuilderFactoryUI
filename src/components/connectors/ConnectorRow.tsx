import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { testConnector } from "@/api/connectors";
import { Badge, Button } from "@/components/common";
import { cn } from "@/lib/utils";
import type { ConnectorRecord, ExecutorType } from "@/types/connector";

const EXECUTOR_VARIANT: Record<
  ExecutorType,
  "success" | "warning" | "destructive" | "secondary" | "accent"
> = {
  http: "accent",
  lambda: "warning",
  sql: "secondary",
  mcp: "success",
};

const jsonAreaClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function parseJsonObject(raw: string): Record<string, unknown> | undefined {
  if (!raw.trim()) return undefined;
  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

export function ConnectorRow({
  connector,
  canWrite,
}: {
  connector: ConnectorRecord;
  canWrite: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [endpointParamsRaw, setEndpointParamsRaw] = useState("{}");
  const [credentialsRaw, setCredentialsRaw] = useState("{}");
  const [payloadRaw, setPayloadRaw] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const testMutation = useMutation({
    mutationFn: () => {
      const endpoint_params = parseJsonObject(endpointParamsRaw) as
        | Record<string, string>
        | undefined;
      const credentials = parseJsonObject(credentialsRaw) as
        | Record<string, string>
        | undefined;
      const test_payload = payloadRaw.trim()
        ? parseJsonObject(payloadRaw)
        : undefined;
      return testConnector(connector.connector_id, {
        endpoint_params,
        credentials,
        test_payload,
      });
    },
    onError: (error) => {
      setParseError(
        error instanceof Error ? error.message : "Invalid JSON input",
      );
    },
  });

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium text-navy">{connector.name}</span>
        <Badge variant={EXECUTOR_VARIANT[connector.executor_type]}>
          {connector.executor_type}
        </Badge>
        {connector.is_global ? <Badge variant="secondary">global</Badge> : null}
        <span className="ml-auto truncate text-sm text-muted-foreground">
          {connector.description}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-3 px-4 pb-4 text-sm">
          {connector.endpoint_template ? (
            <div className="font-mono text-xs text-muted-foreground">
              {connector.endpoint_template}
            </div>
          ) : null}
          {connector.credentials_required.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {connector.credentials_required.map((cred) => (
                <Badge key={cred} variant="outline">
                  {cred}
                </Badge>
              ))}
            </div>
          ) : null}

          {canWrite ? (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-navy">
                Dry-run test (http connectors only)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Endpoint params (JSON)
                  </label>
                  <textarea
                    className={cn(jsonAreaClass, "mt-1 h-16")}
                    value={endpointParamsRaw}
                    onChange={(e) => setEndpointParamsRaw(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Credentials (JSON)
                  </label>
                  <textarea
                    className={cn(jsonAreaClass, "mt-1 h-16")}
                    value={credentialsRaw}
                    onChange={(e) => setCredentialsRaw(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Test payload (JSON, optional — omit for GET)
                </label>
                <textarea
                  className={cn(jsonAreaClass, "mt-1 h-16")}
                  value={payloadRaw}
                  onChange={(e) => setPayloadRaw(e.target.value)}
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={testMutation.isPending}
                onClick={() => {
                  setParseError(null);
                  testMutation.mutate();
                }}
              >
                {testMutation.isPending ? "Testing…" : "Run Test"}
              </Button>

              {parseError ? (
                <p className="text-xs text-destructive">{parseError}</p>
              ) : null}

              {testMutation.data ? (
                <div
                  className={cn(
                    "rounded-md px-3 py-2 text-xs",
                    testMutation.data.success
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-red-50 text-red-800",
                  )}
                >
                  {testMutation.data.summary}
                  {testMutation.data.status_code
                    ? ` (HTTP ${testMutation.data.status_code})`
                    : ""}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
