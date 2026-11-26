/** Starter prompts on the new-chat screen. Each one is answerable from the facts. */
export const CLAUDE_STARTERS = [
  { label: "What did Adam ship at Invoca?", prompt: "What did Adam ship at Invoca, and what came of it?" },
  { label: "Summarize his design leadership", prompt: "Summarize Adam's design leadership experience in five bullets." },
  { label: "How does Adam use Claude?", prompt: "How does Adam use Claude in his work, based on this site?" },
  { label: "Open the case studies", prompt: "Open the case study index." },
] as const;
