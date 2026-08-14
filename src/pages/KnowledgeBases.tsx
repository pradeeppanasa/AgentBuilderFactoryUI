import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  FileText,
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createKnowledgeBase,
  deleteKnowledgeBase,
  listKnowledgeBases,
  reindexKnowledgeBase,
} from "@/api/knowledge-bases";
import { Badge, Button, LoadingSpinner, OptionCard } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosErrorDetail, cn } from "@/lib/utils";
import type {
  CreateKnowledgeBaseRequest,
  KBSourceType,
  KnowledgeBaseRecord,
  KBStatus,
} from "@/types/knowledge-base";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUS_VARIANT: Record<KBStatus, "success" | "warning" | "destructive"> = {
  READY: "success",
  INDEXING: "warning",
  FAILED: "destructive",
};

const SOURCE_TYPES: { value: KBSourceType; label: string; icon: typeof Globe }[] = [
  { value: "s3", label: "S3 Bucket", icon: Database },
  { value: "url", label: "Web URLs", icon: Globe },
  { value: "upload", label: "Upload Files", icon: Upload },
  { value: "manual", label: "Manual Entry", icon: FileText },
];

function KBCard({
  kb,
  canWrite,
  onReindex,
  onDelete,
  reindexPending,
  deletePending,
  deleteError,
}: {
  kb: KnowledgeBaseRecord;
  canWrite: boolean;
  onReindex: () => void;
  onDelete: () => void;
  reindexPending: boolean;
  deletePending: boolean;
  deleteError: string | null;
}) {
  const [confirmingName, setConfirmingName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-navy">{kb.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{kb.description}</p>
        </div>
        <Badge variant={STATUS_VARIANT[kb.status]}>
          {kb.status === "INDEXING" ? "Indexing…" : kb.status}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Source</dt>
          <dd className="mt-0.5 font-medium text-navy">{kb.source_type}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Documents</dt>
          <dd className="mt-0.5 font-medium text-navy">{kb.document_count}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Embedding model</dt>
          <dd className="mt-0.5 truncate font-mono text-[11px] text-navy">
            {kb.embedding_model}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="mt-0.5 font-medium text-navy">
            {new Date(kb.updated_at).toLocaleDateString()}
          </dd>
        </div>
      </dl>

      {deleteError ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {deleteError}
        </p>
      ) : null}

      {canWrite ? (
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={reindexPending}
            onClick={onReindex}
          >
            <RefreshCw size={14} />
            {reindexPending ? "Reindexing…" : "Reindex"}
          </Button>

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
                placeholder={`Type "${kb.name}"`}
                value={confirmingName}
                onChange={(e) => setConfirmingName(e.target.value)}
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={confirmingName !== kb.name || deletePending}
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

export default function KnowledgeBases() {
  const [showForm, setShowForm] = useState(false);
  const [sourceType, setSourceType] = useState<KBSourceType>("s3");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceValue, setSourceValue] = useState(""); // bucket / URL list / file names

  const role = useAuthStore((state) => state.currentUser?.role);
  const canWrite = role === "developer" || role === "admin";
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["knowledge-bases", "list"],
    queryFn: listKnowledgeBases,
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateKnowledgeBaseRequest) => createKnowledgeBase(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases", "list"] });
      setShowForm(false);
      setName("");
      setDescription("");
      setSourceValue("");
    },
  });

  const reindexMutation = useMutation({
    mutationFn: (kbId: string) => reindexKnowledgeBase(kbId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge-bases", "list"] }),
  });

  const [deleteError, setDeleteError] = useState<{ kbId: string; message: string } | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (kbId: string) => deleteKnowledgeBase(kbId),
    onSuccess: (_data, kbId) => {
      setDeleteError((prev) => (prev?.kbId === kbId ? null : prev));
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases", "list"] });
    },
    onError: (error, kbId) => {
      // 409 = still referenced by agent(s) — the backend's error detail
      // names them (Section 37.10's delete-guard).
      setDeleteError({
        kbId,
        message: axiosErrorDetail(error) ?? "Failed to delete knowledge base.",
      });
    },
  });

  function sourceConfigFor(type: KBSourceType, value: string): Record<string, unknown> {
    switch (type) {
      case "s3":
        return { bucket: value };
      case "url":
        return { urls: value.split(",").map((u) => u.trim()).filter(Boolean) };
      case "upload":
        return { file_names: value.split(",").map((f) => f.trim()).filter(Boolean) };
      case "manual":
        return { content: value };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Knowledge Base Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable knowledge bases agents can pick from — index once, use everywhere.
          </p>
        </div>
        {canWrite ? (
          <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} />
            Create Knowledge Base
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name,
              description,
              source_type: sourceType,
              source_config: sourceConfigFor(sourceType, sourceValue),
            });
          }}
        >
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Source</p>
            <div className="grid grid-cols-4 gap-3">
              {SOURCE_TYPES.map((source) => (
                <OptionCard
                  key={source.value}
                  icon={source.icon}
                  label={source.label}
                  selected={sourceType === source.value}
                  onClick={() => setSourceType(source.value)}
                />
              ))}
            </div>
          </div>

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
              <label className="text-sm font-medium text-navy">
                {sourceType === "s3"
                  ? "Bucket name"
                  : sourceType === "url"
                    ? "URLs (comma-separated)"
                    : sourceType === "upload"
                      ? "Files (comma-separated)"
                      : "Content"}
              </label>
              <input
                className={cn(inputClass, "mt-1")}
                value={sourceValue}
                onChange={(e) => setSourceValue(e.target.value)}
                required
              />
            </div>
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

          {createMutation.isError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Failed to create knowledge base. Please try again.
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? <LoadingSpinner label="Loading knowledge bases…" /> : null}

      {isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Could not load knowledge bases. Verify the Factory Runtime is reachable.
        </div>
      ) : null}

      {data && data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Database size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No knowledge bases yet.</p>
          {canWrite ? (
            <Button variant="accent" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create your first Knowledge Base
            </Button>
          ) : null}
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {data.items.map((kb) => (
            <KBCard
              key={kb.kb_id}
              kb={kb}
              canWrite={canWrite}
              onReindex={() => reindexMutation.mutate(kb.kb_id)}
              onDelete={() => deleteMutation.mutate(kb.kb_id)}
              reindexPending={
                reindexMutation.isPending && reindexMutation.variables === kb.kb_id
              }
              deletePending={
                deleteMutation.isPending && deleteMutation.variables === kb.kb_id
              }
              deleteError={deleteError?.kbId === kb.kb_id ? deleteError.message : null}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
