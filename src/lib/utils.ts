import { isAxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// FastAPI's HTTPException responses usually shape as { detail: string },
// but field-level validation errors (e.g. guardrail policy BERT threshold
// checks in app/api/v1/guardrail_policies.py, or Pydantic's own 422s) shape
// as { detail: Array<{field?, message?} | {loc?, msg?}> } instead. Handles
// both so any 4xx with a specific, user-facing reason surfaces it instead
// of a generic "request failed".
export function axiosErrorDetail(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry: unknown) => {
        if (typeof entry === "string") return entry;
        if (typeof entry !== "object" || entry === null) return null;
        const e = entry as Record<string, unknown>;
        const field =
          typeof e.field === "string"
            ? e.field
            : Array.isArray(e.loc)
              ? e.loc.join(".")
              : undefined;
        const message = typeof e.message === "string" ? e.message : typeof e.msg === "string" ? e.msg : undefined;
        if (field && message) return `${field}: ${message}`;
        return message ?? field ?? null;
      })
      .filter((m): m is string => Boolean(m));
    return messages.length ? messages.join("; ") : null;
  }
  return null;
}
