import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { deleteGuardrailPolicy, listGuardrailPolicies } from "@/api/guardrail-policies";
import { Button, LoadingSpinner, ResourceDeleteDialog } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import type { GuardrailPolicy } from "@/types/guardrail-policy";

// Non-admins see name + description only here (deliberately more restrictive
// than the read-only detail page at /platform/guardrail-policies/{id}, which
// shows the full config per 37.14) — everything else about a policy is admin
// business at the library level.
function PolicyCard({
  policy,
  isAdmin,
  onDeleted,
}: {
  policy: GuardrailPolicy;
  isAdmin: boolean;
  onDeleted: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-medium text-navy">{policy.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{policy.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">Managed by your platform admin.</p>
        <Link
          to={`/platform/guardrail-policies/${policy.policy_id}`}
          className="mt-2 inline-block text-xs text-teal hover:underline"
        >
          View details
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-navy">{policy.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{policy.description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link to={`/platform/guardrail-policies/${policy.policy_id}/edit`}>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </Link>

        <Button size="sm" variant="destructive" onClick={() => setDialogOpen(true)}>
          <Trash2 size={14} />
          Delete
        </Button>

        <ResourceDeleteDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          resourceName={policy.name}
          resourceTypeLabel="guardrail policy"
          requireTypeToConfirm
          onPermanentDelete={async () => {
            await deleteGuardrailPolicy(policy.policy_id);
            onDeleted();
          }}
        />
      </div>
    </div>
  );
}

export default function GuardrailPolicies() {
  const role = useAuthStore((state) => state.currentUser?.role);
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guardrail-policies", "list"],
    queryFn: listGuardrailPolicies,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Guardrail Policy Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            3-layer input/output safety pipeline. Agents pick a policy — security-critical
            settings are admin-managed and cannot be weakened per-agent.
          </p>
        </div>
        {isAdmin ? (
          <Link to="/platform/guardrail-policies/new">
            <Button variant="accent">
              <Plus size={16} />
              Create Policy
            </Button>
          </Link>
        ) : null}
      </div>

      {isLoading ? <LoadingSpinner label="Loading guardrail policies…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load guardrail policies. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <ShieldCheck size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No guardrail policies yet.</p>
          {isAdmin ? (
            <Link to="/platform/guardrail-policies/new">
              <Button variant="accent">
                <Plus size={16} />
                Create your first Policy
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {data.items.map((policy) => (
            <PolicyCard
              key={policy.policy_id}
              policy={policy}
              isAdmin={isAdmin}
              onDeleted={() =>
                queryClient.invalidateQueries({ queryKey: ["guardrail-policies", "list"] })
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
