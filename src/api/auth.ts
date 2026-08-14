import { httpClient } from "./http";
import type {
  CurrentUser,
  LoginRequest,
  RefreshRequest,
  TokenResponse,
} from "@/types/auth";

export async function login(request: LoginRequest): Promise<TokenResponse> {
  const { data } = await httpClient.post<TokenResponse>(
    "/auth/login",
    request,
  );
  return data;
}

export async function refresh(
  request: RefreshRequest,
): Promise<TokenResponse> {
  const { data } = await httpClient.post<TokenResponse>(
    "/auth/refresh",
    request,
  );
  return data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await httpClient.get<CurrentUser>("/auth/me");
  return data;
}
