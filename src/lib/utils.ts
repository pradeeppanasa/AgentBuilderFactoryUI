import { isAxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// FastAPI's HTTPException responses always shape as { detail: string }.
// Surfaces that message instead of a generic "request failed" — used
// anywhere a 4xx carries a specific, user-facing reason (e.g. malformed
// OpenAPI spec, "still referenced by agent X").
export function axiosErrorDetail(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const detail = error.response?.data?.detail;
  return typeof detail === "string" ? detail : null;
}
