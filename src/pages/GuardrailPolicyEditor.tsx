import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  createGuardrailPolicy,
  getGuardrailPolicy,
  updateGuardrailPolicy,
} from "@/api/guardrail-policies";
import { Button, LoadingSpinner } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail } from "@/lib/utils";
import {
  BasicInfoSection,
  BedrockSection,
  BertSection,
  ComplianceSection,
  KeywordsSection,
  OutputSection,
  PiiSection,
  PipelineDiagram,
  SectionNav,
  TopicsSection,
  type NavGroup,
} from "@/components/guardrail-policy";
import {
  BERT_BLOCK_THRESHOLD_MIN,
  BERT_ESCALATE_THRESHOLD_MAX,
  DEFAULT_BLOCKED_KEYWORDS,
  defaultBedrockContentFilters,
  defaultBertConfig,
  defaultBlockedMessages,
  defaultComplianceConfig,
  defaultPiiConfig,
  defaultTopicConfig,
  type BedrockContentFilters,
  type BertConfig,
  type BlockedMessages,
  type ComplianceConfig,
  type CreateGuardrailPolicyRequest,
  type GuardrailPolicy,
  type KeywordPolicy,
  type PiiConfig,
  type TopicConfig,
} from "@/types/guardrail-policy";

interface Draft {
  name: string;
  description: string;
  bert: BertConfig;
  bedrock_enabled: boolean;
  bedrock_credential_id: string | null;
  bedrock_content_filters: BedrockContentFilters;
  pii: PiiConfig;
  topics: TopicConfig;
  keywords: KeywordPolicy;
  compliance: ComplianceConfig;
  blocked_messages: BlockedMessages;
}

function draftFromPolicy(policy: GuardrailPolicy): Draft {
  return {
    name: policy.name,
    description: policy.description,
    bert: policy.bert,
    bedrock_enabled: policy.bedrock_enabled,
    bedrock_credential_id: policy.bedrock_credential_id,
    bedrock_content_filters: policy.bedrock_content_filters,
    pii: policy.pii,
    topics: policy.topics,
    keywords: policy.keywords,
    compliance: policy.compliance,
    blocked_messages: policy.blocked_messages,
  };
}

// 37.14: "Default blocked keywords pre-loaded (admin can remove)" — a
// create-form convenience only. KeywordPolicy.rules defaults to an empty
// list server-side; these are just seeded into the local draft so a new
// policy doesn't start from a completely blank keyword list.
function defaultDraft(): Draft {
  return {
    name: "",
    description: "",
    bert: defaultBertConfig(),
    bedrock_enabled: true,
    bedrock_credential_id: null,
    bedrock_content_filters: defaultBedrockContentFilters(),
    pii: defaultPiiConfig(),
    topics: defaultTopicConfig(),
    keywords: {
      rules: DEFAULT_BLOCKED_KEYWORDS.map((pattern) => ({
        pattern,
        pattern_type: "LITERAL" as const,
        action: "BLOCK" as const,
      })),
    },
    compliance: defaultComplianceConfig(),
    blocked_messages: defaultBlockedMessages(),
  };
}

const NAV_GROUPS: NavGroup[] = [
  { title: "", items: [{ id: "basic-info", label: "Basic info" }] },
  {
    title: "Panasa layers",
    items: [
      { id: "bert", label: "Layer 1 — BERT" },
      { id: "bedrock", label: "Layer 2 — Bedrock" },
    ],
  },
  {
    title: "Content rules",
    items: [
      { id: "pii", label: "PII protection" },
      { id: "topics", label: "Topics" },
      { id: "keywords", label: "Keywords" },
      { id: "compliance", label: "Compliance" },
    ],
  },
  { title: "Output", items: [{ id: "output", label: "Blocked messages" }] },
];

export default function GuardrailPolicyEditor() {
  const { policyId } = useParams<{ policyId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.currentUser?.role);
  const isAdmin = role === "admin";

  const isNew = !policyId;
  const isEditRoute = location.pathname.endsWith("/edit");
  const readOnly = !isAdmin || (!isNew && !isEditRoute);

  // Admins reach create/edit only through explicit "Create"/"Edit" actions —
  // a non-admin landing on either URL directly is bounced to the read-only
  // view (or the library, for /new).
  useEffect(() => {
    if (!isAdmin && (isNew || isEditRoute)) {
      navigate(
        isNew || !policyId
          ? "/platform/guardrail-policies"
          : `/platform/guardrail-policies/${policyId}`,
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isNew, isEditRoute]);

  const [activeSection, setActiveSection] = useState("basic-info");
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [seeded, setSeeded] = useState(isNew);

  const {
    data: policy,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["guardrail-policies", "detail", policyId],
    queryFn: () => getGuardrailPolicy(policyId as string),
    enabled: !isNew,
  });

  useEffect(() => {
    if (policy && !seeded) {
      setDraft(draftFromPolicy(policy));
      setSeeded(true);
    }
  }, [policy, seeded]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedGuardrailId, setSavedGuardrailId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (request: CreateGuardrailPolicyRequest) => createGuardrailPolicy(request),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["guardrail-policies", "list"] });
      setSaveError(null);
      setSavedGuardrailId(created.bedrock_guardrail_id);
      navigate(`/platform/guardrail-policies/${created.policy_id}/edit`, { replace: true });
    },
    onError: (error) =>
      setSaveError(axiosErrorDetail(error) ?? "Failed to save guardrail policy."),
  });

  const updateMutation = useMutation({
    mutationFn: (request: CreateGuardrailPolicyRequest) =>
      updateGuardrailPolicy(policyId as string, request),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["guardrail-policies", "list"] });
      queryClient.invalidateQueries({ queryKey: ["guardrail-policies", "detail", policyId] });
      setSaveError(null);
      setSavedGuardrailId(updated.bedrock_guardrail_id);
    },
    onError: (error) =>
      setSaveError(axiosErrorDetail(error) ?? "Failed to save guardrail policy."),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const thresholdError =
    draft.bert.block_threshold < BERT_BLOCK_THRESHOLD_MIN
      ? `Block threshold cannot be below ${BERT_BLOCK_THRESHOLD_MIN.toFixed(2)}.`
      : draft.bert.escalate_threshold > BERT_ESCALATE_THRESHOLD_MAX
        ? `Escalate threshold cannot be above ${BERT_ESCALATE_THRESHOLD_MAX.toFixed(2)}.`
        : draft.bert.escalate_threshold >= draft.bert.block_threshold
          ? "Escalate threshold must be lower than the block threshold."
          : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (thresholdError) return;
    setSavedGuardrailId(null);
    const request: CreateGuardrailPolicyRequest = {
      name: draft.name,
      description: draft.description,
      bert: draft.bert,
      bedrock_enabled: draft.bedrock_enabled,
      bedrock_credential_id: draft.bedrock_credential_id,
      bedrock_content_filters: draft.bedrock_content_filters,
      pii: draft.pii,
      topics: draft.topics,
      keywords: draft.keywords,
      compliance: draft.compliance,
      blocked_messages: draft.blocked_messages,
    };
    if (isNew) {
      createMutation.mutate(request);
    } else {
      updateMutation.mutate(request);
    }
  }

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!isNew && isLoading) {
    return <LoadingSpinner label="Loading guardrail policy…" />;
  }

  if (!isNew && isError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Could not load this guardrail policy.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/platform/guardrail-policies"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-navy"
          >
            <ArrowLeft size={14} />
            Guardrail Policy Library
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-navy">
            {isNew ? "New Guardrail Policy" : draft.name || "Guardrail Policy"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && !isEditRoute && isAdmin ? (
            <Link to={`/platform/guardrail-policies/${policyId}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          ) : null}
          {!readOnly ? (
            <Button
              type="submit"
              form="guardrail-policy-form"
              variant="accent"
              disabled={saving || !!thresholdError}
            >
              {saving ? "Saving…" : "Save Policy"}
            </Button>
          ) : null}
        </div>
      </div>

      {readOnly && !isNew ? (
        <p className="rounded-md border border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          Read-only — guardrail policies are managed by your platform admin.
        </p>
      ) : null}

      {saveError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {saveError}
        </div>
      ) : null}

      {savedGuardrailId !== null ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Policy saved. Bedrock guardrail ID: {savedGuardrailId}
        </div>
      ) : null}

      {thresholdError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {thresholdError}
        </div>
      ) : null}

      <PipelineDiagram />

      <form id="guardrail-policy-form" onSubmit={handleSubmit} className="flex gap-6">
        <SectionNav groups={NAV_GROUPS} activeId={activeSection} onSelect={scrollTo} />

        <div className="max-w-[680px] flex-1 space-y-5">
          <BasicInfoSection
            name={draft.name}
            description={draft.description}
            onNameChange={(name) => setDraft((d) => ({ ...d, name }))}
            onDescriptionChange={(description) => setDraft((d) => ({ ...d, description }))}
            readOnly={readOnly}
            isNew={isNew}
          />
          <BertSection
            value={draft.bert}
            onChange={(bert) => setDraft((d) => ({ ...d, bert }))}
            readOnly={readOnly}
          />
          <BedrockSection
            enabled={draft.bedrock_enabled}
            onEnabledChange={(bedrock_enabled) => setDraft((d) => ({ ...d, bedrock_enabled }))}
            credentialId={draft.bedrock_credential_id}
            onCredentialIdChange={(bedrock_credential_id) =>
              setDraft((d) => ({ ...d, bedrock_credential_id }))
            }
            guardrailId={policy?.bedrock_guardrail_id ?? null}
            guardrailVersion={policy?.bedrock_guardrail_version ?? "DRAFT"}
            filters={draft.bedrock_content_filters}
            onFiltersChange={(bedrock_content_filters) =>
              setDraft((d) => ({ ...d, bedrock_content_filters }))
            }
            readOnly={readOnly}
          />
          <PiiSection
            value={draft.pii}
            onChange={(pii) => setDraft((d) => ({ ...d, pii }))}
            readOnly={readOnly}
          />
          <TopicsSection
            value={draft.topics}
            onChange={(topics) => setDraft((d) => ({ ...d, topics }))}
            readOnly={readOnly}
          />
          <KeywordsSection
            value={draft.keywords}
            onChange={(keywords) => setDraft((d) => ({ ...d, keywords }))}
            readOnly={readOnly}
          />
          <ComplianceSection
            value={draft.compliance}
            onChange={(compliance) => setDraft((d) => ({ ...d, compliance }))}
            readOnly={readOnly}
          />
          <OutputSection
            value={draft.blocked_messages}
            onChange={(blocked_messages) => setDraft((d) => ({ ...d, blocked_messages }))}
            readOnly={readOnly}
          />

          {!readOnly ? (
            <div className="flex items-center justify-end border-t border-border pt-5">
              <Button
                type="submit"
                form="guardrail-policy-form"
                variant="accent"
                disabled={saving || !!thresholdError}
              >
                {saving ? "Saving…" : "Save Policy"}
              </Button>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
