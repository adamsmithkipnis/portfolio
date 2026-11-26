/**
 * The Claude app's model and its spend guards.
 *
 * Calls go through the Braintrust proxy, like Messages. The token cap is
 * higher than Messages' (300) because answers here are paragraphs and an
 * artifact's text arrives inside a tool call, but it stays bounded: `/api/claude` is a public endpoint.
 */
export const CLAUDE_APP_MODEL_DEFAULT = "claude-sonnet-5-5";
/**
 * The route reads this. CLAUDE_APP_MODEL_OVERRIDE is for local testing only
 * (for example before an Anthropic key is added to Braintrust's AI Providers);
 * never set it in production, or the "Claude" app answers with another model.
 */
export const CLAUDE_APP_MODEL =
  (typeof process !== "undefined" && process.env.CLAUDE_APP_MODEL_OVERRIDE) || CLAUDE_APP_MODEL_DEFAULT;
/** What the composer shows; keep in step with CLAUDE_APP_MODEL. */
export const CLAUDE_APP_MODEL_LABEL = "Sonnet 5.5";
export const CLAUDE_APP_MAX_TOKENS = 1000;
export const CLAUDE_APP_TEMPERATURE = 0.4;

/** Longest single visitor message the route accepts. */
export const CLAUDE_MAX_MESSAGE_CHARS = 2000;
