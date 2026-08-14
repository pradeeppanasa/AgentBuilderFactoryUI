import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCode, Plus } from "lucide-react";
import {
  createConnector,
  importOpenApiConnectors,
  listConnectors,
} from "@/api/connectors";
import { Badge, Button, LoadingSpinner } from "@/components/common";
import { ConnectorRow } from "@/components/connectors/ConnectorRow";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn } from "@/lib/utils";

const EXECUTOR_TYPES = ["http", "lambda", "sql", "mcp"] as const;

const createConnectorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  executor_type: z.enum(EXECUTOR_TYPES),
  description: z.string().min(1, "Description is required"),
  endpoint_template: z.string().optional(),
  credentials_required: z.string().optional(),
});

type CreateConnectorFormValues = z.infer<typeof createConnectorSchema>;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Connectors() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [specText, setSpecText] = useState("");
  const [specParseError, setSpecParseError] = useState<string | null>(null);
  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["connectors", "list"],
    queryFn: listConnectors,
  });

  // Accepts JSON or YAML, exactly like the backend's own parser (both are
  // sent as the raw string — no client-side parsing/auth-method concept:
  // credentials_required is auto-detected server-side from the spec's own
  // securitySchemes).
  //
  // Note on the "review discovered endpoints before creating" step the
  // spec describes: the backend has exactly one endpoint, and it parses
  // AND creates a connector per operation in the same call — there is no
  // parse-only/preview capability to call first, and duplicating its
  // OpenAPI-parsing logic in the frontend just to build a fake preview
  // would violate "don't create duplicate backend functionality in the
  // UI". So this shows the discovered/created connectors immediately
  // *after* the one real call succeeds (keeping the form open instead of
  // auto-closing) rather than faking a pre-creation preview.
  const importMutation = useMutation({
    mutationFn: () => importOpenApiConnectors({ schema_document: specText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectors", "list"] });
      setSpecParseError(null);
    },
    onError: (error) => {
      setSpecParseError(
        axiosErrorDetail(error) ?? "Could not parse this OpenAPI document.",
      );
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateConnectorFormValues>({
    resolver: zodResolver(createConnectorSchema),
    defaultValues: { executor_type: "http" },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateConnectorFormValues) =>
      createConnector({
        name: values.name,
        executor_type: values.executor_type,
        description: values.description,
        endpoint_template: values.endpoint_template || null,
        credentials_required: values.credentials_required
          ? values.credentials_required.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectors", "list"] });
      reset();
      setShowForm(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Connectors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tool catalog — global and tenant-custom connectors.
          </p>
        </div>
        {canWrite ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowImport((v) => !v);
                setShowForm(false);
              }}
            >
              <FileCode size={16} />
              Import from API spec
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                setShowForm((v) => !v);
                setShowImport(false);
              }}
            >
              <Plus size={16} />
              Add Connector
            </Button>
          </div>
        ) : null}
      </div>

      {showImport ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <label className="text-sm font-medium text-navy">
              OpenAPI 3.0 spec (JSON or YAML)
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              One connector is generated per path + method operation. Auth requirements are
              detected automatically from the spec.
            </p>
            <textarea
              className={cn(inputClass, "mt-2 min-h-40 font-mono text-xs")}
              placeholder='{"openapi": "3.0.0", "paths": {...}}'
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              disabled={Boolean(importMutation.data)}
            />
          </div>

          {specParseError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {specParseError}
            </div>
          ) : null}

          {importMutation.data ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">
                Discovered and created {importMutation.data.created.length} connector
                {importMutation.data.created.length === 1 ? "" : "s"}:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {importMutation.data.created.map((c) => (
                  <Badge key={c.connector_id} variant="success">
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex gap-3">
            {importMutation.data ? (
              <Button
                variant="accent"
                onClick={() => {
                  setSpecText("");
                  setShowImport(false);
                  importMutation.reset();
                }}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="accent"
                  disabled={!specText.trim() || importMutation.isPending}
                  onClick={() => {
                    setSpecParseError(null);
                    importMutation.mutate();
                  }}
                >
                  {importMutation.isPending ? "Parsing & creating…" : "Parse & Create Connectors"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImport(false);
                    setSpecText("");
                    setSpecParseError(null);
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {showForm ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-card p-5"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-navy">Name</label>
              <input className={cn(inputClass, "mt-1")} {...register("name")} />
              {errors.name ? (
                <p className="mt-1 text-xs text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-navy">
                Executor Type
              </label>
              <select
                className={cn(inputClass, "mt-1")}
                {...register("executor_type")}
              >
                {EXECUTOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-navy">
              Description
            </label>
            <input
              className={cn(inputClass, "mt-1")}
              {...register("description")}
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-navy">
              Endpoint Template
            </label>
            <input
              className={cn(inputClass, "mt-1")}
              placeholder="https://{domain}.atlassian.net/rest/api/3"
              {...register("endpoint_template")}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-navy">
              Credentials Required (comma-separated)
            </label>
            <input
              className={cn(inputClass, "mt-1")}
              placeholder="api_key, domain"
              {...register("credentials_required")}
            />
          </div>

          {createMutation.isError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Failed to create connector. Please try again.
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="accent"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create Connector"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? <LoadingSpinner label="Loading connectors…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load connectors. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No connectors yet.
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {data.items.map((connector) => (
            <ConnectorRow
              key={connector.connector_id}
              connector={connector}
              canWrite={canWrite}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
