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
  // Structured single-error bodies (e.g. app/api/v1/playground.py's
  // {error, message, provider, model_id} on a 502) — a plain object with a
  // string `message`, not the field-level validation array handled below.
  if (
    typeof detail === "object" &&
    detail !== null &&
    !Array.isArray(detail) &&
    typeof (detail as { message?: unknown }).message === "string"
  ) {
    return (detail as { message: string }).message;
  }
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

// U-09: the playground's error panel needs both the status code and the
// human-readable reason ("Playground error (502)" + message), not just the
// message axiosErrorDetail returns.
export function axiosErrorStatus(error: unknown): number | null {
  if (!isAxiosError(error)) return null;
  return error.response?.status ?? null;
}

// Runs list (Observability — Runs Feature, Section 2): "Time" column shows
// relative time ("3 min ago") with the absolute timestamp on hover via the
// caller's title attribute.
export function formatRelativeTime(isoTimestamp: string): string {
  const deltaMs = Date.now() - new Date(isoTimestamp).getTime();
  const deltaSec = Math.round(deltaMs / 1000);
  if (deltaSec < 5) return "just now";
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const deltaMin = Math.round(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin} min ago`;
  const deltaHour = Math.round(deltaMin / 60);
  if (deltaHour < 24) return `${deltaHour}h ago`;
  const deltaDay = Math.round(deltaHour / 24);
  return `${deltaDay}d ago`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatCostUsd(cost: number | null): string {
  return cost === null ? "—" : `$${cost.toFixed(2)}`;
}
