import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { TokenResponse } from "@/types/auth";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const httpClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Bare client with no interceptors — used for the refresh call itself so a
// failed refresh can never re-trigger the response interceptor's refresh logic.
const refreshClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.request.use((config) => {
  const { accessToken, currentUser } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (currentUser) {
    config.headers.set("X-Tenant-Id", currentUser.tenant_id);
  }
  return config;
});

function redirectToLogin(): void {
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status !== 401 ||
      isAuthEndpoint ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    try {
      const { data } = await refreshClient.post<TokenResponse>(
        "/auth/refresh",
        { refresh_token: refreshToken },
      );
      useAuthStore.getState().setTokens(data);
      originalRequest.headers.set("Authorization", `Bearer ${data.access_token}`);
      return httpClient(originalRequest);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
