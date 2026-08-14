export type Role = "admin" | "developer" | "analyst" | "auditor";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  tenant_id: string;
  is_active: boolean;
}
