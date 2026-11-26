/**
 * How many Sonnet answers each visitor has had, keyed by the anonymous
 * session cookie the rate limiter already sets.
 *
 * Kept in server memory beside the rate-limit buckets, so it is approximate:
 * a cold start or a different serverless instance starts the count again.
 * That only ever errs toward giving someone more Sonnet answers, and the
 * per-visitor rate limits still bound the spend. Entries are dropped after
 * 30 days, the cookie's own lifetime.
 */

const ENTRY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 50_000;

type Entry = { sonnetAnswers: number; lastSeenAt: number };
type Store = { entries: Map<string, Entry>; lastCleanupAt: number };
type GlobalWithStore = typeof globalThis & { __claudeVisitorUsage?: Store };

function store(): Store {
  const g = globalThis as GlobalWithStore;
  if (!g.__claudeVisitorUsage) {
    g.__claudeVisitorUsage = { entries: new Map(), lastCleanupAt: Date.now() };
  }
  return g.__claudeVisitorUsage;
}

function cleanup(now: number) {
  const s = store();
  if (now - s.lastCleanupAt < CLEANUP_INTERVAL_MS && s.entries.size < MAX_ENTRIES) return;
  for (const [key, entry] of s.entries) {
    if (now - entry.lastSeenAt > ENTRY_TTL_MS) s.entries.delete(key);
  }
  // Still too big: drop the oldest. Losing a count only means more Sonnet.
  if (s.entries.size >= MAX_ENTRIES) {
    const oldest = [...s.entries].sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt);
    for (const [key] of oldest.slice(0, s.entries.size - MAX_ENTRIES + 1)) s.entries.delete(key);
  }
  s.lastCleanupAt = now;
}

export function getSonnetAnswerCount(visitorId: string, now = Date.now()): number {
  cleanup(now);
  const entry = store().entries.get(visitorId);
  if (!entry || now - entry.lastSeenAt > ENTRY_TTL_MS) return 0;
  return entry.sonnetAnswers;
}

/** Count one finished Sonnet answer for this visitor. */
export function recordSonnetAnswer(visitorId: string, now = Date.now()): void {
  const entries = store().entries;
  const current = getSonnetAnswerCount(visitorId, now);
  entries.set(visitorId, { sonnetAnswers: current + 1, lastSeenAt: now });
}

/** Test hook. */
export function resetVisitorUsage(): void {
  store().entries.clear();
}
