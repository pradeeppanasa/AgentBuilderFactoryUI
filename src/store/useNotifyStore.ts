import { create } from "zustand";

export type NotifyVariant = "success" | "error";

interface Notification {
  id: string;
  message: string;
  variant: NotifyVariant;
}

interface NotifyState {
  notification: Notification | null;
  show: (message: string, variant: NotifyVariant) => void;
  dismiss: () => void;
}

// U-11 (Wizard Redesign QA, 2026-08-19): generic success/failure toast for
// async actions (save draft, generate IaC, deploy) — distinct from
// useUndoToastStore, which always carries an undo action and a longer
// (10s) duration. This one is fire-and-forget feedback, auto-dismissed by
// NotifyToastContainer.
export const useNotifyStore = create<NotifyState>((set) => ({
  notification: null,
  show: (message, variant) =>
    set({ notification: { id: crypto.randomUUID(), message, variant } }),
  dismiss: () => set({ notification: null }),
}));
