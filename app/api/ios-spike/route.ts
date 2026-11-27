import { NextRequest, NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  checkRateLimit,
  getClientIdentity,
  parseJsonBodyWithLimit,
} from "@/lib/server/request-security";

/**
 * Receives a finished run of the Phase 0 gesture spike (/ios-spike) and writes
 * it to the function log, where it can be read back from Vercel's runtime
 * logs by its code. Nothing is stored. Throwaway: delete with the spike.
 */

const MAX_BODY_BYTES = 24 * 1024;
const RATE_LIMIT_IP = { scope: "ios_spike_ip", limit: 10, windowMs: 60_000 } as const;
const LOG_MARKER = "ios-spike-result";
const MAX_STEPS = 20;
// One log line per step, each kept short enough that no log viewer truncates it.
const MAX_LINE_CHARS = 1500;

function line(code: string, part: string, value: unknown) {
  console.log(`${LOG_MARKER} ${code} ${part} ${JSON.stringify(value).slice(0, MAX_LINE_CHARS)}`);
}

export async function POST(req: NextRequest) {
  const identity = getClientIdentity(req);
  const rateLimit = checkRateLimit(identity.ip, RATE_LIMIT_IP);
  const respond = (body: unknown, status: number) => {
    const response = NextResponse.json(body, { status });
    applyRateLimitHeaders(response.headers, rateLimit);
    return response;
  };

  if (!rateLimit.allowed) return respond({ ok: false, error: "Too many requests" }, 429);

  const parsed = await parseJsonBodyWithLimit<Record<string, unknown>>(req, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return respond(
      { ok: false, error: parsed.reason === "too_large" ? "Body too large" : "Invalid JSON" },
      parsed.reason === "too_large" ? 413 : 400
    );
  }

  const { code, setup, environment, steps, log } = parsed.body;
  if (typeof code !== "string" || !/^[A-Z0-9]{4}$/.test(code) || !Array.isArray(steps)) {
    return respond({ ok: false, error: "Not a spike result" }, 400);
  }

  line(code, "run", { setup, environment });
  steps.slice(0, MAX_STEPS).forEach((step, index) => line(code, `step${index}`, step));
  line(code, "log", Array.isArray(log) ? log.slice(0, 25) : []);

  return respond({ ok: true }, 200);
}
