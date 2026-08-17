import { useEffect } from "react";
import { Undo2 } from "lucide-react";
import { useUndoToastStore } from "@/store/useUndoToastStore";

// Mounted once in AppShell. Section 38.11: "every archive action shows a
// 10-second undo toast ... After 10 seconds the toast disappears and the
// action is final (but still restorable from the archived view)."
export function UndoToastContainer() {
  const toast = useUndoToastStore((s) => s.toast);
  const dismiss = useUndoToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, 10_000);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-navy px-4 py-3 text-sm text-white shadow-xl">
      <span>{toast.message}</span>
      <button
        type="button"
        className="flex items-center gap-1 font-medium text-teal hover:text-teal-300"
        onClick={() => {
          toast.onUndo();
          dismiss();
        }}
      >
        <Undo2 size={14} />
        Undo
      </button>
    </div>
  );
}
