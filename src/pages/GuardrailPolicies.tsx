import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  createGuardrailPolicy,
  deleteGuardrailPolicy,
  listGuardrailPolicies,
} from "@/api/guardrail-policies";
import { Badge, Button, InfoTooltip, LoadingSpinner, Slider, Toggle } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn } from "@/lib/utils";
import {
  BERT_BLOCK_THRESHOLD_MIN,
  BERT_ESCALATE_THRESHOLD_MAX,
} from "@/types/guardrail-policy";
import type {
  CreateGuardrailPolicyRequest,
  GuardrailPolicy,
} from "@/types/guardrail-policy";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const PII_ENTITIES = ["NAME", "EMAIL", "PHONE", "SSN", "CREDIT_CARD", "ADDRESS"];

function PipelineDiagram({ policy }: { policy: GuardrailPolicy }) {
  return (
    <div className="mt-4 flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-muted/20 p-4 text-xs">
      <div className="flex min-w-32 flex-col items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
        <span className="font-medium text-emerald-800">Layer 1 · BERT</span>
        <span className="text-emerald-700">
          Block ≥ {Math.round(policy.bert_block_threshold * 100)}%
        </span>
        <span className="text-emerald-700">
          Safe &lt; {Math.round(policy.bert_escalate_threshold * 100)}%
        </span>
      </div>
      <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
      <div className="flex min-w-32 flex-col items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center">
        <span className="font-medium text-amber-800">Layer 2 · Bedrock</span>
        <span className="text-amber-700">Only when unsure</span>
      </div>
      <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
      <div className="flex min-w-32 flex-col items-center gap-1 rounded-md border border-teal/30 bg-teal/5 px-3 py-2 text-center">
        <span className="font-medium text-navy">Layer 3 · LLM</span>
        <span className="text-muted-foreground">Runs the agent</span>
      </div>
    </div>
  );
}

function PolicyCard({
  policy,
  isAdmin,
  onDelete,
  deletePending,
  deleteError,
}: {
  policy: GuardrailPolicy;
  isAdmin: boolean;
  onDelete: () => void;
  deletePending: boolean;
  deleteError: string | null;
}) {
  const [confirmingName, setConfirmingName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Non-admins get name + description only (37.13 #10 — no unnecessary
  // internal detail exposed) and no delete affordance at all: everything
  // else here (thresholds, pipeline, badges, delete) is admin-only.
  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-medium text-navy">{policy.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{policy.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">Managed by your platform admin.</p>
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
        <div className="flex gap-1.5">
          {policy.output_pii_redaction ? <Badge variant="secondary">PII redaction</Badge> : null}
          {policy.output_profanity_filter ? <Badge variant="secondary">Profanity filter</Badge> : null}
        </div>
      </div>

      <PipelineDiagram policy={policy} />

      {deleteError ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {deleteError}
        </p>
      ) : null}

      {isAdmin ? (
        <div className="mt-4">
          {!confirmOpen ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                className={cn(inputClass, "h-9 w-40")}
                placeholder={`Type "${policy.name}"`}
                value={confirmingName}
                onChange={(e) => setConfirmingName(e.target.value)}
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={confirmingName !== policy.name || deletePending}
                onClick={onDelete}
              >
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function GuardrailPolicies() {
  const role = useAuthStore((state) => state.currentUser?.role);
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [blockThreshold, setBlockThreshold] = useState(0.85);
  const [escalateThreshold, setEscalateThreshold] = useState(0.4);
  const [piiRedaction, setPiiRedaction] = useState(true);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([...PII_ENTITIES]);
  const [profanityFilter, setProfanityFilter] = useState(true);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guardrail-policies", "list"],
    queryFn: listGuardrailPolicies,
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateGuardrailPolicyRequest) => createGuardrailPolicy(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardrail-policies", "list"] });
      setShowForm(false);
      setName("");
      setDescription("");
    },
  });

  const [deleteError, setDeleteError] = useState<{ policyId: string; message: string } | null>(
    null,
  );
  const deleteMutation = useMutation({
    mutationFn: (policyId: string) => deleteGuardrailPolicy(policyId),
    onSuccess: (_data, policyId) => {
      setDeleteError((prev) => (prev?.policyId === policyId ? null : prev));
      queryClient.invalidateQueries({ queryKey: ["guardrail-policies", "list"] });
    },
    onError: (error, policyId) => {
      setDeleteError({
        policyId,
        message: axiosErrorDetail(error) ?? "Failed to delete guardrail policy.",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Guardrail Policy Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            3-layer input/output safety pipeline. Agents pick a policy — thresholds are
            admin-managed and cannot be weakened.
          </p>
        </div>
        {isAdmin ? (
          <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} />
            Create Policy
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form
          className="space-y-5 rounded-lg border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name,
              description,
              bert_block_threshold: blockThreshold,
              bert_escalate_threshold: escalateThreshold,
              output_pii_redaction: piiRedaction,
              output_pii_entities: selectedEntities,
              output_profanity_filter: profanityFilter,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-navy">Name</label>
              <input
                className={cn(inputClass, "mt-1")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Description</label>
              <input
                className={cn(inputClass, "mt-1")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-teal" />
              <p className="text-sm font-medium text-navy">Layer 1 — BERT thresholds</p>
              <InfoTooltip text="Runs locally inside the VPC in ~50ms. Scores above the block threshold reject immediately with no LLM call." />
            </div>

            <Slider
              label="Block at or above (min 70%)"
              value={blockThreshold}
              min={BERT_BLOCK_THRESHOLD_MIN}
              max={1}
              step={0.01}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={setBlockThreshold}
            />
            <div className="mt-4">
              <Slider
                label="Safe below, otherwise escalate (max 60%)"
                value={escalateThreshold}
                min={0}
                max={BERT_ESCALATE_THRESHOLD_MAX}
                step={0.01}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={setEscalateThreshold}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Scores between these two thresholds escalate to Layer 2 (Bedrock Guardrail).
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium text-navy">Output guardrails</p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-navy">PII redaction</span>
              <Toggle checked={piiRedaction} onChange={setPiiRedaction} />
            </div>

            {piiRedaction ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {PII_ENTITIES.map((entity) => {
                  const selected = selectedEntities.includes(entity);
                  return (
                    <button
                      key={entity}
                      type="button"
                      onClick={() =>
                        setSelectedEntities((prev) =>
                          selected ? prev.filter((e) => e !== entity) : [...prev, entity],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-teal bg-teal/10 text-teal"
                          : "border-border text-muted-foreground hover:border-teal/40",
                      )}
                    >
                      {entity}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-navy">Profanity filter</span>
              <Toggle checked={profanityFilter} onChange={setProfanityFilter} />
            </div>
          </div>

          {createMutation.isError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Failed to create policy. Please try again.
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Policy"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

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
            <Button variant="accent" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create your first Policy
            </Button>
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
              onDelete={() => deleteMutation.mutate(policy.policy_id)}
              deletePending={
                deleteMutation.isPending && deleteMutation.variables === policy.policy_id
              }
              deleteError={
                deleteError?.policyId === policy.policy_id ? deleteError.message : null
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
