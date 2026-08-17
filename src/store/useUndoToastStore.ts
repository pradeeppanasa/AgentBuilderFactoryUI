import { create } from "zustand";

interface UndoToast {
  id: string;
  message: string;
  onUndo: () => void;
}

interface UndoToastState {
  toast: UndoToast | null;
  show: (message: string, onUndo: () => void) => void;
  dismiss: () => void;
}

// Section 38.11: "every archive action shows a 10-second undo toast."
// Zustand keeps this consistent with the rest of the app's global state
// pattern (useAuthStore) rather than introducing a separate context.
export const useUndoToastStore = create<UndoToastState>((set) => ({
  toast: null,
  show: (message, onUndo) =>
    set({ toast: { id: crypto.randomUUID(), message, onUndo } }),
  dismiss: () => set({ toast: null }),
}));
