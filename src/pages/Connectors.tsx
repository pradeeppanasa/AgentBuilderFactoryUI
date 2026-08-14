import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { createConnector, listConnectors } from "@/api/connectors";
import { Button, LoadingSpinner } from "@/components/common";
import { ConnectorRow } from "@/components/connectors/ConnectorRow";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

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
  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["connectors", "list"],
    queryFn: listConnectors,
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
          <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} />
            Add Connector
          </Button>
        ) : null}
      </div>

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
