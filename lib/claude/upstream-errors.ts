import type { ClaudeErrorReason } from "./types";

/**
 * The proxy answers 404 when no provider is set up for the model, for
 * example before an Anthropic key is added in Braintrust's AI Providers.
 * That is configuration, not an outage, so it gets its own reason.
 */
export function classifyUpstreamError(error: unknown): ClaudeErrorReason {
  const status =
    error && typeof error === "object" && "status" in error ? (error as { status: unknown }).status : undefined;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (status === 404 || message.includes("no provider found")) return "not_configured";
  // Anthropic refuses with a billing error once the month's API credit is gone
  // (auto-reload off), until the next month's credit arrives.
  if (status === 402 || message.includes("credit balance")) return "out_of_credit";
  if (isQuotaError(error)) return "quota_exceeded";
  return "upstream_unavailable";
}

function isQuotaError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 429) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("quota") || message.includes("insufficient");
}
