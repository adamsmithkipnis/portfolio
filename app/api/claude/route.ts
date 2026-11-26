import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { NextRequest, NextResponse } from "next/server";
import { wrapOpenAI } from "braintrust";
import { logger } from "@/app/api/logger";
import { trimConversationHistory } from "@/lib/messages/history-window";
import {
  applyRateLimitHeaders,
  applySessionCookie,
  checkRateLimit,
  getClientIdentity,
  parseJsonBodyWithLimit,
  pickMostConstrainedRateLimit,
} from "@/lib/server/request-security";
import {
  CLAUDE_APP_MAX_TOKENS,
  CLAUDE_APP_PRIMARY_MODEL,
  getModelOverride,
  pickClaudeAppModel,
} from "@/lib/claude/model";
import { getSonnetAnswerCount, recordSonnetAnswer } from "@/lib/claude/visitor-usage";
import { buildClaudeSystemPrompt } from "@/lib/claude/system-prompt";
import { buildClaudeTools, toClaudeAction } from "@/lib/claude/tools";
import type { ClaudeAction, ClaudeErrorReason, ClaudeStreamEvent } from "@/lib/claude/types";
import { parseIncomingMessages } from "@/lib/claude/incoming";
import { classifyUpstreamError } from "@/lib/claude/upstream-errors";

/**
 * The Claude app's chat endpoint. Public, so it keeps every guard /api/chat
 * has: per-session and per-IP rate limits, a body cap, a per-message cap, the
 * shared sliding history window, and a max_tokens cap. It streams
 * newline-delimited JSON (see ClaudeStreamEvent).
 */

export const maxDuration = 30;

const UPSTREAM_TIMEOUT_MS = 25_000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_ACTIONS_PER_REPLY = 3;
const RATE_LIMIT_SESSION = { scope: "claude_session", limit: 20, windowMs: 60_000 } as const;
const RATE_LIMIT_IP = { scope: "claude_ip", limit: 60, windowMs: 60_000 } as const;

const SYSTEM_PROMPT = buildClaudeSystemPrompt();
const TOOLS = buildClaudeTools();

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    client = wrapOpenAI(
      new OpenAI({
        baseURL: "https://api.braintrust.dev/v1/proxy",
        apiKey: process.env.BRAINTRUST_API_KEY!,
        timeout: UPSTREAM_TIMEOUT_MS,
        maxRetries: 0,
      })
    ) as unknown as OpenAI;
  }
  return client;
}


const encoder = new TextEncoder();
const line = (event: ClaudeStreamEvent) => encoder.encode(`${JSON.stringify(event)}\n`);

const STREAM_HEADERS = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(req: NextRequest) {
  const identity = getClientIdentity(req);
  const sessionLimit = checkRateLimit(identity.sessionId, RATE_LIMIT_SESSION);
  const ipLimit = checkRateLimit(identity.ip, RATE_LIMIT_IP);
  const activeLimit = pickMostConstrainedRateLimit([sessionLimit, ipLimit]);

  // Errors before streaming still answer in the stream format, so the client
  // has one path for every outcome.
  const errorResponse = (reason: ClaudeErrorReason, status = 200, retryAfterSeconds?: number) => {
    const body = new Blob([line({ type: "error", reason, retryAfterSeconds }), line({ type: "done" })]);
    const response = new NextResponse(body, { status, headers: STREAM_HEADERS });
    applyRateLimitHeaders(response.headers, activeLimit);
    applySessionCookie(response, identity);
    if (retryAfterSeconds) response.headers.set("Retry-After", String(retryAfterSeconds));
    return response;
  };

  if (!sessionLimit.allowed || !ipLimit.allowed) {
    const blocked = !sessionLimit.allowed ? sessionLimit : ipLimit;
    return errorResponse("rate_limited", 200, Math.max(1, Math.ceil(blocked.retryAfterMs / 1000)));
  }

  const parsedBody = await parseJsonBodyWithLimit<Record<string, unknown>>(req, MAX_BODY_BYTES);
  if (!parsedBody.ok) {
    return errorResponse(parsedBody.reason === "too_large" ? "payload_too_large" : "invalid_request", 400);
  }

  const incoming = parseIncomingMessages(parsedBody.body.messages);
  if (!incoming) return errorResponse("invalid_request", 400);

  const thread = trimConversationHistory(incoming);
  // The window can drop the opening turns; the model needs to start on a user turn.
  while (thread.length > 0 && thread[0].role !== "user") thread.shift();

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...thread.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Sonnet for a visitor's first answers, then Haiku (lib/claude/model.ts).
  const sonnetAnswersSoFar = getSonnetAnswerCount(identity.sessionId);
  const tierModel = pickClaudeAppModel(sonnetAnswersSoFar);
  const model = getModelOverride() ?? tierModel;

  const upstreamAbort = new AbortController();
  const timeout = setTimeout(() => upstreamAbort.abort("claude upstream timeout"), UPSTREAM_TIMEOUT_MS);
  req.signal.addEventListener("abort", () => upstreamAbort.abort("client closed"));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ClaudeStreamEvent) => {
        try {
          controller.enqueue(line(event));
        } catch {
          // The client went away; keep draining so the span still closes.
        }
      };

      try {
        await logger.traced(
          async (span) => {
            span.log({
              input: { user_message: thread[thread.length - 1].content },
              metadata: {
                app: "claude",
                message_count: thread.length,
                model: model.id,
                visitor_sonnet_answers: sonnetAnswersSoFar,
              },
            });
            send({ type: "model", label: model.label });

            const completion = await getClient().chat.completions.create(
              {
                model: model.id,
                messages: chatMessages,
                tools: TOOLS,
                stream: true,
                max_tokens: CLAUDE_APP_MAX_TOKENS,
              },
              { signal: upstreamAbort.signal }
            );

            let text = "";
            let finishReason: string | null = null;
            const calls = new Map<number, { name: string; args: string }>();
            for await (const chunk of completion) {
              const choice = chunk.choices[0];
              if (choice?.finish_reason) finishReason = choice.finish_reason;
              const delta = choice?.delta;
              if (delta?.content) {
                text += delta.content;
                send({ type: "text", delta: delta.content });
              }
              for (const call of delta?.tool_calls ?? []) {
                const entry = calls.get(call.index) ?? { name: "", args: "" };
                if (call.function?.name) entry.name += call.function.name;
                if (call.function?.arguments) entry.args += call.function.arguments;
                calls.set(call.index, entry);
              }
            }

            // One action of each kind per reply, at most three, all validated.
            const seen = new Set<string>();
            const actions: ClaudeAction[] = [];
            for (const call of calls.values()) {
              if (actions.length >= MAX_ACTIONS_PER_REPLY) break;
              const action = toClaudeAction(call.name, call.args);
              if (!action || seen.has(action.type)) continue;
              seen.add(action.type);
              actions.push(action);
              send({ type: "action", action });
            }

            // A reply cut off by max_tokens can leave a tool call's JSON
            // unfinished, which validation drops. Say so instead of going quiet.
            if (finishReason === "length" && actions.length < calls.size) {
              const note = "_That ran past the length limit for this demo. Ask for a shorter version._";
              text += `${text ? "\n\n" : ""}${note}`;
              send({ type: "text", delta: text === note ? note : `\n\n${note}` });
            }

            span.log({ output: { assistant_response: text, actions }, metadata: { finish_reason: finishReason } });

            // Only a finished Sonnet answer counts toward the visitor's quota.
            if (tierModel.id === CLAUDE_APP_PRIMARY_MODEL.id && (text || actions.length > 0)) {
              recordSonnetAnswer(identity.sessionId);
            }
          },
          { name: "claude-app" }
        );
        send({ type: "done" });
      } catch (error) {
        if (!req.signal.aborted) {
          console.error("Claude app upstream error:", error);
          send({ type: "error", reason: classifyUpstreamError(error) });
          send({ type: "done" });
        }
      } finally {
        clearTimeout(timeout);
        try {
          controller.close();
        } catch {
          // Already closed by a cancelled client.
        }
      }
    },
    cancel() {
      upstreamAbort.abort("client cancelled");
    },
  });

  const response = new NextResponse(stream, { status: 200, headers: STREAM_HEADERS });
  applyRateLimitHeaders(response.headers, activeLimit);
  applySessionCookie(response, identity);
  return response;
}
