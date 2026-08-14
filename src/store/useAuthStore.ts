import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUser, TokenResponse } from "@/types/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: CurrentUser | null;
  setTokens: (tokens: TokenResponse) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      setTokens: (tokens) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        }),
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, currentUser: null }),
    }),
    { name: "panasa-auth" },
  ),
);
