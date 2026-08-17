import { useState } from "react";
import { isAxiosError } from "axios";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";
import type { ReferencingAgent } from "@/types/project";

interface ResourceDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  resourceName: string;
  resourceTypeLabel: string; // "guardrail policy", "knowledge base", "skill", "project", "agent"
  /** Section 38.11: type-to-confirm required for published/multi-referenced items. */
  requireTypeToConfirm: boolean;
  /** Omit entirely when the backend has no archive concept for this resource
   * yet (e.g. KB/Guardrail Policy today) — the dialog then only offers
   * permanent delete, still with the same dependency-check + type-to-confirm
   * behaviour. */
  onArchive?: () => Promise<void>;
  onPermanentDelete: () => Promise<void>;
  onArchived?: () => void; // called after a successful archive, for the undo toast
}

interface Blocked {
  message: string | null;
  agents: ReferencingAgent[] | null;
}

// Section 38.11's "Deleting anything" 4 rules in one reusable component:
// dependency check surfaces the real 409 (never a generic "can't delete"),
// Archive defaults over permanent delete, type-to-confirm gates destructive
// actions, and permanent delete is visually secondary/red.
export function ResourceDeleteDialog({
  open,
  onClose,
  resourceName,
  resourceTypeLabel,
  requireTypeToConfirm,
  onArchive,
  onPermanentDelete,
  onArchived,
}: ResourceDeleteDialogProps) {
  const [action, setAction] = useState<"archive" | "delete">(onArchive ? "archive" : "delete");
  const [typedName, setTypedName] = useState("");
  const [pending, setPending] = useState(false);
  const [blocked, setBlocked] = useState<Blocked | null>(null);

  function reset() {
    setTypedName("");
    setPending(false);
    setBlocked(null);
    setAction(onArchive ? "archive" : "delete");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleConfirm() {
    setPending(true);
    setBlocked(null);
    try {
      if (action === "archive" && onArchive) {
        await onArchive();
        onArchived?.();
      } else {
        await onPermanentDelete();
      }
      handleClose();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        const data = error.response.data;
        const agents = Array.isArray(data?.referenced_by) ? data.referenced_by : null;
        const message = typeof data?.detail === "string" ? data.detail : null;
        setBlocked({ message, agents });
      }
    } finally {
      setPending(false);
    }
  }

  const confirmDisabled =
    pending || (requireTypeToConfirm && typedName !== resourceName);

  return (
    <Modal open={open} onClose={handleClose} title={`Delete ${resourceTypeLabel}`}>
      <div className="space-y-4">
        {blocked ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Can't delete — still in use
            </p>
            {blocked.agents ? (
              <ul className="mt-2 space-y-1.5">
                {blocked.agents.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm text-amber-800">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-xs text-amber-700">· {a.project}</span>
                    <Badge variant="secondary">{a.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : blocked.message ? (
              <p className="mt-2 text-sm text-amber-800">{blocked.message}</p>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              This will affect <span className="font-medium text-navy">{resourceName}</span>.
            </p>

            {onArchive ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAction("archive")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    action === "archive"
                      ? "border-teal bg-teal/5 ring-1 ring-teal"
                      : "border-border hover:border-teal/40",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-navy">Archive (Recommended)</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Hidden from lists, data kept, agents using it keep working. Restorable
                      any time.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAction("delete")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    action === "delete"
                      ? "border-destructive bg-red-50 ring-1 ring-destructive"
                      : "border-border hover:border-destructive/40",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-destructive">Delete permanently</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Irreversible. Blocked if anything still references it.
                    </p>
                  </div>
                </button>
              </div>
            ) : null}

            {requireTypeToConfirm ? (
              <div>
                <label className="text-xs font-medium text-navy">
                  Type "{resourceName}" to confirm
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  autoFocus
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        {blocked ? (
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant={action === "delete" ? "destructive" : "accent"}
              disabled={confirmDisabled}
              onClick={handleConfirm}
            >
              {pending
                ? "Working…"
                : action === "archive"
                  ? "Archive"
                  : "Delete permanently"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
