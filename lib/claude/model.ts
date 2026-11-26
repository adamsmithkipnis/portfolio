/**
 * The Claude app's models and its spend guards.
 *
 * Calls go through the Braintrust proxy, like Messages, using the Anthropic
 * key added in Braintrust's AI Providers. Each visitor gets Sonnet for their
 * first SONNET_ANSWERS_PER_VISITOR answers, then Haiku: most visitors see
 * the better model, and a long session costs a tenth as much per answer.
 *
 * No temperature is sent: Sonnet 5.5 and Haiku 5.5 reject non-default
 * sampling values with a 400.
 */

export interface ClaudeAppModel {
  id: string;
  /** What the composer shows after this model answers. */
  label: string;
}

export const CLAUDE_APP_PRIMARY_MODEL: ClaudeAppModel = { id: "claude-sonnet-5-5", label: "Sonnet 5.5" };
export const CLAUDE_APP_ECONOMY_MODEL: ClaudeAppModel = { id: "claude-haiku-5-5", label: "Haiku 5.5" };

/** Sonnet answers each visitor gets before the app moves them to Haiku. */
export const SONNET_ANSWERS_PER_VISITOR = 10;

/** Pick the model for a visitor's next answer from how many Sonnet answers they've had. */
export function pickClaudeAppModel(sonnetAnswersSoFar: number): ClaudeAppModel {
  return sonnetAnswersSoFar < SONNET_ANSWERS_PER_VISITOR ? CLAUDE_APP_PRIMARY_MODEL : CLAUDE_APP_ECONOMY_MODEL;
}

/**
 * Local testing only (for example before the Anthropic key is in Braintrust):
 * CLAUDE_APP_MODEL_OVERRIDE replaces both models. Never set it in production,
 * or the "Claude" app answers with another model.
 */
export function getModelOverride(): ClaudeAppModel | null {
  const id = typeof process !== "undefined" ? process.env.CLAUDE_APP_MODEL_OVERRIDE : undefined;
  return id ? { id, label: `${id} (local override)` } : null;
}

/**
 * Per-answer output cap. Sonnet 5.5 and Haiku 5.5 think by default, and
 * thinking counts against this, so it leaves room above the ~180-word answers
 * and ~300-word artifacts the prompt asks for.
 */
export const CLAUDE_APP_MAX_TOKENS = 1500;

/** Longest single visitor message the route accepts. */
export const CLAUDE_MAX_MESSAGE_CHARS = 2000;
