import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifyStore } from "@/store/useNotifyStore";

// Mounted once in AppShell, alongside UndoToastContainer. U-11: generic
// success/failure feedback for async actions (save draft, generate
// infrastructure, deploy) — auto-dismisses after 3 seconds, no action button.
export function NotifyToastContainer() {
  const notification = useNotifyStore((s) => s.notification);
  const dismiss = useNotifyStore((s) => s.dismiss);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(dismiss, 3_000);
    return () => window.clearTimeout(timer);
  }, [notification, dismiss]);

  if (!notification) return null;

  const isSuccess = notification.variant === "success";

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-xl",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      <span>{notification.message}</span>
    </div>
  );
}
