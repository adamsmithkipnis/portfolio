import { Eval, type EvalScorer, wrapOpenAI } from "braintrust";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import {
  GROUP_CHAT_MODEL,
  buildGroupPrompt,
  buildGroupTools,
} from "../lib/messages/group-chat-model";
import {
  formatConversationReversed,
  getConversationState,
} from "../lib/messages/temporal-context";
import type { Message, Recipient } from "../types/messages";
import { initialContacts } from "../data/messages/initial-contacts";

dotenv.config({ path: ".env.local" });

type GroupChatActionName = "react" | "respond" | "wait" | "wrap_up";

interface GroupChatAction {
  action: GroupChatActionName;
  participant?: string;
  reaction?: string;
  message?: string;
  messages?: string[];
}

interface EvalParticipant extends Recipient {
  description: string;
}

interface GroupChatEvalInput {
  caseId: string;
  participants: EvalParticipant[];
  messages: Message[];
}

interface GroupChatExpected {
  requiredAction: GroupChatActionName;
  allowedActions: GroupChatActionName[];
  participant?: string;
}

interface GroupChatEvalOutput {
  actions: GroupChatAction[];
  state: ReturnType<typeof getConversationState>;
}

const API_BASE_URL = "https://api.braintrust.dev/v1/proxy";
const REPEATED_POINT_THRESHOLD = 0.75;
const REPETITION_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "but",
  "for",
  "from",
  "have",
  "into",
  "just",
  "like",
  "that",
  "the",
  "their",
  "then",
  "they",
  "this",
  "with",
  "you",
  "your",
]);

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.BRAINTRUST_API_KEY) {
    throw new Error("BRAINTRUST_API_KEY is required to run chat evals");
  }

  if (!client) {
    client = wrapOpenAI(
      new OpenAI({
        baseURL: API_BASE_URL,
        apiKey: process.env.BRAINTRUST_API_KEY,
        timeout: 12000,
        maxRetries: 0,
      })
    ) as unknown as OpenAI;
  }

  return client;
}

function minutesAgo(minutes: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

function parseToolCallArguments(
  rawArguments: string | undefined
): Record<string, unknown> {
  if (!rawArguments) return {};

  try {
    const parsed = JSON.parse(rawArguments);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulTokens(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter(
        (token) =>
          token.length >= 3 && !REPETITION_STOP_WORDS.has(token)
      )
  );
}

function repeatedPointSimilarity(generated: string, prior: string): number {
  const normalizedGenerated = normalizeText(generated);
  const normalizedPrior = normalizeText(prior);
  if (!normalizedGenerated || !normalizedPrior) return 0;
  if (normalizedGenerated === normalizedPrior) return 1;

  const generatedTokens = meaningfulTokens(generated);
  const priorTokens = meaningfulTokens(prior);
  const smallestTokenCount = Math.min(
    generatedTokens.size,
    priorTokens.size
  );
  if (smallestTokenCount < 3) return 0;

  let sharedTokenCount = 0;
  generatedTokens.forEach((token) => {
    if (priorTokens.has(token)) sharedTokenCount++;
  });

  return sharedTokenCount / smallestTokenCount;
}

function sentenceCount(value: string): number {
  const matches = value.match(/[.!?]+/g);
  if (!matches) {
    return value.trim().length > 0 ? 1 : 0;
  }
  return matches.length;
}

function extractGeneratedTexts(actions: GroupChatAction[]): string[] {
  return actions.flatMap((action) => {
    if (action.action === "respond") {
      return (action.messages ?? []).filter(
        (message): message is string => typeof message === "string"
      );
    }

    if (action.action === "wrap_up" && typeof action.message === "string") {
      return [action.message];
    }

    return [];
  });
}

function findPrimaryAction(
  actions: GroupChatAction[],
  actionName: GroupChatActionName
): GroupChatAction | undefined {
  return actions.find((action) => action.action === actionName);
}

function parseActions(toolCalls: ChatCompletionMessageToolCall[] | undefined): GroupChatAction[] {
  if (!toolCalls?.length) return [];

  return toolCalls.map((toolCall) => {
    const args = parseToolCallArguments(toolCall.function.arguments);
    return {
      action: toolCall.function.name as GroupChatActionName,
      participant:
        typeof args.participant === "string" ? args.participant : undefined,
      reaction: typeof args.reaction === "string" ? args.reaction : undefined,
      message: typeof args.message === "string" ? args.message : undefined,
      messages: Array.isArray(args.messages)
        ? args.messages.filter(
            (message): message is string =>
              typeof message === "string" && message.trim().length > 0
          )
        : undefined,
    };
  });
}

function buildParticipantDescriptions(participants: EvalParticipant[]): string {
  return participants
    .map(
      (participant) => `- ${participant.name}: ${participant.description}`
    )
    .join("\n");
}

// Participants are pulled from the shipped roster so the eval always exercises
// the real prompts. If a contact is renamed or removed, this throws rather than
// silently testing a persona that no longer exists.
function participant(name: string): EvalParticipant {
  const contact = initialContacts.find((c) => c.name === name);
  if (!contact?.prompt) {
    throw new Error(
      `Eval references "${name}", which is not in initialContacts (or has no prompt).`
    );
  }
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name: contact.name,
    description: contact.prompt,
  };
}

const participants = {
  yeager: participant("Chuck Yeager"),
  hoover: participant("Bob Hoover"),
  jacobs: participant("Jane Jacobs"),
  moses: participant("Robert Moses"),
  gehry: participant("Frank Gehry"),
  guidara: participant("Will Guidara"),
  bourdain: participant("Anthony Bourdain"),
  rubin: participant("Rick Rubin"),
  eno: participant("Brian Eno"),
  kondo: participant("Koji Kondo"),
  socrates: participant("Socrates"),
  turing: participant("Alan Turing"),
  fred: participant("Fred again.."),
} satisfies Record<string, EvalParticipant>;

/**
 * Per-persona voice rules. These encode the specific instructions in each
 * prompt that a general brevity check cannot catch — the ones most likely to
 * be quietly ignored by the model.
 */
interface VoiceRule {
  maxChars?: number;
  maxSentences?: number;
  /** Patterns that must NOT appear (the prompt's "never do X" clauses). */
  forbidden?: Array<{ pattern: RegExp; why: string }>;
  /** Custom predicate; return an error string when violated. */
  custom?: (text: string) => string | null;
}

const voiceRules: Record<string, VoiceRule> = {
  "Chuck Yeager": {
    // Character count only. A sentence cap punishes exactly what we want from
    // him — "scared? nah. just busy." is three sentences and perfectly in voice.
    maxChars: 100,
    forbidden: [
      { pattern: /\b(thank you|honou?red|proud of|means a lot)\b/i, why: "accepts praise" },
      { pattern: /\b(taught me|realized that|what it meant)\b/i, why: "explains significance" },
    ],
  },
  "Socrates": {
    maxChars: 160,
    custom: (text) =>
      text.trim().endsWith("?") ? null : "did not end with a question",
  },
  "Koji Kondo": {
    forbidden: [
      { pattern: /\b(art|artistry|beautiful|soul|magic)\b/i, why: "grand terms about art" },
    ],
  },
  "Fred again..": {
    custom: (text) =>
      /^[A-Z]/.test(text.trim()) ? "started with a capital letter" : null,
  },
  "Robert Moses": {
    forbidden: [
      { pattern: /\b(sorry|regret|mistake|I was wrong|apolog)/i, why: "concedes or apologizes" },
    ],
  },
};

const cases: Array<{ input: GroupChatEvalInput; expected: GroupChatExpected }> = [
  {
    input: {
      caseId: "direct-question-routes-to-yeager",
      participants: [participants.yeager, participants.hoover],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "who actually closed the hatch on the x-1",
          timestamp: minutesAgo(12),
        },
        {
          id: "m2",
          sender: "Bob Hoover",
          content:
            "Ridley cut down a broom handle for him. He'd broken two ribs off a horse two nights before.",
          timestamp: minutesAgo(11),
        },
        {
          id: "m3",
          sender: "me",
          content: "chuck were you scared going up that morning?",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "respond",
      allowedActions: ["respond", "react"],
      participant: "Chuck Yeager",
    },
  },
  {
    input: {
      caseId: "participant-question-does-not-wait",
      participants: [participants.jacobs, participants.moses, participants.gehry],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "if you could un-build one thing what would it be",
          timestamp: minutesAgo(14),
        },
        {
          id: "m2",
          sender: "Frank Gehry",
          content: "are we doing cities? I make buildings. different job",
          timestamp: minutesAgo(13),
        },
        {
          id: "m3",
          sender: "Robert Moses",
          content:
            "Jane, name one thing you have ever actually built. I'll wait.",
          timestamp: minutesAgo(2),
        },
      ],
    },
    expected: {
      requiredAction: "respond",
      allowedActions: ["respond", "react"],
      participant: "Jane Jacobs",
    },
  },
  {
    input: {
      caseId: "wait-when-human-needs-to-answer",
      participants: [participants.guidara, participants.bourdain],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "thinking about what hospitality even means outside a restaurant",
          timestamp: minutesAgo(8),
        },
        {
          id: "m2",
          sender: "Anthony Bourdain",
          content: "it means the same thing, people just charge less for it",
          timestamp: minutesAgo(7),
        },
        {
          id: "m3",
          sender: "Will Guidara",
          content: "what's the last time somebody made you feel taken care of?",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "wait",
      allowedActions: ["wait"],
    },
  },
  {
    input: {
      caseId: "wrap-up-after-three-ai-messages",
      participants: [participants.rubin, participants.eno, participants.kondo],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "what does a producer actually add",
          timestamp: minutesAgo(9),
        },
        {
          id: "m2",
          sender: "Rick Rubin",
          content: "as little as possible. mostly I sit there and pay attention",
          timestamp: minutesAgo(8),
        },
        {
          id: "m3",
          sender: "Brian Eno",
          content:
            "I do the opposite. I hand you a card and make you follow it.",
          timestamp: minutesAgo(7),
        },
        {
          id: "m4",
          sender: "Koji Kondo",
          content:
            "The field theme has twelve phrases assembled in a random order. There is no take.",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "wrap_up",
      allowedActions: ["wrap_up"],
    },
  },
  {
    input: {
      caseId: "socrates-answers-with-a-question",
      participants: [participants.socrates, participants.turing],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "could a machine think",
          timestamp: minutesAgo(6),
        },
        {
          id: "m2",
          sender: "Alan Turing",
          content:
            "If it converses well enough that you cannot tell, the question has answered itself.",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "respond",
      allowedActions: ["respond", "react"],
      participant: "Socrates",
    },
  },
  {
    input: {
      caseId: "fred-stays-lowercase",
      participants: [participants.fred, participants.eno],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "how do you know when a voice note is worth building on",
          timestamp: minutesAgo(5),
        },
        {
          id: "m2",
          sender: "Brian Eno",
          content:
            "You don't. That's why you keep the recorder running and decide much later.",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "respond",
      allowedActions: ["respond", "react"],
      participant: "Fred again..",
    },
  },
];

const requiredActionScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output, expected }) => ({
  name: "required_action",
  score: output.actions.some(
    (action) => action.action === expected.requiredAction
  )
    ? 1
    : 0,
  metadata: {
    requiredAction: expected.requiredAction,
    actions: output.actions.map((action) => action.action),
  },
});

const allowedActionsScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output, expected }) => ({
  name: "allowed_actions_only",
  score:
    output.actions.length > 0 &&
    output.actions.every((action) =>
      expected.allowedActions.includes(action.action)
    )
      ? 1
      : 0,
  metadata: {
    allowedActions: expected.allowedActions,
    actions: output.actions.map((action) => action.action),
  },
});

const participantScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output, expected }) => {
  if (!expected.participant) {
    return { name: "expected_participant", score: 1 };
  }

  const action = findPrimaryAction(output.actions, expected.requiredAction);

  return {
    name: "expected_participant",
    score: action?.participant === expected.participant ? 1 : 0,
    metadata: {
      expectedParticipant: expected.participant,
      actualParticipant: action?.participant ?? null,
    },
  };
};

const schemaScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output }) => {
  const valid = output.actions.length > 0 && output.actions.every((action) => {
    if (action.action === "wait") return true;
    if (action.action === "react") {
      return Boolean(action.participant && action.reaction);
    }
    if (action.action === "respond") {
      return Boolean(
        action.participant &&
          action.messages &&
          action.messages.length >= 1 &&
          action.messages.every((message) => message.trim().length > 0)
      );
    }
    return Boolean(action.participant && action.message?.trim().length);
  });

  return {
    name: "schema_valid",
    score: valid ? 1 : 0,
  };
};

const noRepeatedPointScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ input, output }) => {
  const priorAiMessages = input.messages.filter(
    (message) => message.sender !== "me" && message.sender !== "system"
  );
  const repeats = extractGeneratedTexts(output.actions).flatMap(
    (generatedText) =>
      priorAiMessages.flatMap((priorMessage) => {
        const similarity = repeatedPointSimilarity(
          generatedText,
          priorMessage.content
        );
        return similarity >= REPEATED_POINT_THRESHOLD
          ? [
              {
                generatedText,
                priorText: priorMessage.content,
                similarity,
              },
            ]
          : [];
      })
  );

  return {
    name: "no_repeated_ai_point",
    score: repeats.length === 0 ? 1 : 0,
    metadata: {
      repeats,
      threshold: REPEATED_POINT_THRESHOLD,
    },
  };
};

const brevityScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output }) => {
  const generatedTexts = extractGeneratedTexts(output.actions);
  const valid = generatedTexts.every((text) => {
    const trimmed = text.trim();
    // A short burst of fragments ("scared? nah. just busy.") is good texting,
    // so the sentence cap only applies once a message has real length to it.
    return (
      trimmed.length > 0 &&
      trimmed.length <= 160 &&
      (sentenceCount(trimmed) <= 2 || trimmed.length <= 100)
    );
  });

  return {
    name: "brief_texting_style",
    score: valid ? 1 : 0,
    metadata: {
      texts: generatedTexts,
    },
  };
};

/**
 * Checks the per-persona instructions that a generic brevity bar cannot catch:
 * Yeager's fragments, Socrates answering only in questions, Fred's lowercase,
 * Kondo never reaching for "art", Moses never conceding.
 *
 * Only scores personas that have a rule; everything else passes trivially.
 */
const voiceDisciplineScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output }) => {
  const violations: Array<{ speaker: string; text: string; reason: string }> = [];
  let checked = 0;

  for (const action of output.actions) {
    const speaker = action.participant;
    if (!speaker) continue;
    const rule = voiceRules[speaker];
    if (!rule) continue;

    const texts = [action.message, ...(action.messages ?? [])].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );

    for (const text of texts) {
      checked += 1;
      const trimmed = text.trim();

      if (rule.maxChars && trimmed.length > rule.maxChars) {
        violations.push({
          speaker,
          text: trimmed,
          reason: `${trimmed.length} chars exceeds ${rule.maxChars}`,
        });
      }
      if (rule.maxSentences && sentenceCount(trimmed) > rule.maxSentences) {
        violations.push({
          speaker,
          text: trimmed,
          reason: `${sentenceCount(trimmed)} sentences exceeds ${rule.maxSentences}`,
        });
      }
      for (const { pattern, why } of rule.forbidden ?? []) {
        if (pattern.test(trimmed)) {
          violations.push({ speaker, text: trimmed, reason: why });
        }
      }
      const customFailure = rule.custom?.(trimmed);
      if (customFailure) {
        violations.push({ speaker, text: trimmed, reason: customFailure });
      }
    }
  }

  return {
    name: "voice_discipline",
    // No rule for this persona means nothing to check — don't penalize.
    score: checked === 0 ? null : violations.length === 0 ? 1 : 0,
    metadata: { violations, textsChecked: checked },
  };
};

/**
 * Blind attribution: hide the speaker and ask a judge which participant wrote
 * it. If the judge cannot pick the right person out of the lineup, the persona
 * is not distinct — which is the property we actually care about.
 *
 * Note: with two participants, chance alone scores 0.5, so read this as a
 * trend across cases rather than a verdict on any single one.
 */
const personaAttributionScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = async ({ input, output }) => {
  const attempts: Array<{ text: string; actual: string; guessed: string }> = [];

  for (const action of output.actions) {
    const speaker = action.participant;
    if (!speaker) continue;
    const texts = [action.message, ...(action.messages ?? [])].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );

    for (const text of texts) {
      const lineup = input.participants.map((p) => p.name);
      const response = await getClient().chat.completions.create({
        model: GROUP_CHAT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You will be shown one text message and a list of people. Reply with exactly one name from the list — the person most likely to have written it. No punctuation, no explanation.",
          },
          {
            role: "user",
            content: `People: ${lineup.join(", ")}\n\nMessage: ${text}`,
          },
        ],
        temperature: 0,
        max_tokens: 20,
      });

      const raw = response.choices[0]?.message?.content?.trim() ?? "";
      const guessed =
        lineup.find((name) => raw.toLowerCase().includes(name.toLowerCase())) ?? raw;
      attempts.push({ text, actual: speaker, guessed });
    }
  }

  if (attempts.length === 0) {
    return { name: "persona_attribution", score: null, metadata: { attempts } };
  }

  const correct = attempts.filter((a) => a.guessed === a.actual).length;
  return {
    name: "persona_attribution",
    score: correct / attempts.length,
    metadata: { attempts, correct, total: attempts.length },
  };
};

async function runEval() {
  const result = await Eval("messages-group-chat", {
    data: cases,
    // Generation runs at temperature 0.7, so a single sample per case cannot
    // separate a prompt change from sampling noise. Repeat each case and read
    // the averages.
    trialCount: 5,
    maxConcurrency: 1,
    metadata: {
      app: "messages",
      surface: "group-chat",
      model: GROUP_CHAT_MODEL,
    },
    task: async (input, hooks) => {
      const state = getConversationState(input.messages);
      const conversationReversed = formatConversationReversed(input.messages);
      const prompt = buildGroupPrompt(
        input.participants,
        buildParticipantDescriptions(input.participants),
        conversationReversed,
        state
      );
      const tools = buildGroupTools(
        input.participants.map((participant) => participant.name),
        state.lastSpeaker
      );

      hooks.meta({
        caseId: input.caseId,
        lastSpeaker: state.lastSpeaker,
        messagesSinceHuman: state.messagesSinceHuman,
      });

      const response = await getClient().chat.completions.create({
        model: GROUP_CHAT_MODEL,
        messages: [{ role: "system", content: prompt }],
        tool_choice: "required",
        tools,
        stream: false,
        parallel_tool_calls: false,
        temperature: 0.7,
        max_tokens: 300,
      });

      return {
        actions: parseActions(response.choices[0]?.message?.tool_calls),
        state,
      };
    },
    scores: [
      requiredActionScore,
      allowedActionsScore,
      participantScore,
      schemaScore,
      noRepeatedPointScore,
      brevityScore,
      voiceDisciplineScore,
      personaAttributionScore,
    ],
  });

  const behaviorGaps = result.results.filter((evalResult) =>
    Object.values(evalResult.scores).some((score) => score === 0)
  );
  if (behaviorGaps.length > 0) {
    console.warn("\nBehavior gaps detected:");
    behaviorGaps.forEach((evalResult) => {
      const failedScores = Object.entries(evalResult.scores)
        .filter(([, score]) => score === 0)
        .map(([name]) => name);
      console.warn(
        `- ${evalResult.input.caseId}: ${failedScores.join(", ")}; actions=${JSON.stringify(evalResult.output.actions)}`
      );
    });
  }
}

runEval().catch((error) => {
  console.error("Messages group-chat eval failed:", error);
  process.exitCode = 1;
});
