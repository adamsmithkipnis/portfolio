/**
 * The AI stand-in for the site owner. The only persona that speaks as a living
 * person, so the label travels with the name: "(AI)" shows in the sidebar,
 * header, bubbles and notification, and the prompt makes it say so when asked.
 */
export const ADAM_AI_NAME = "Adam Smith-Kipnis (AI)";
export const ADAM_AI_CONVERSATION_ID = "0c5d1e7a-4b92-4f36-8a1d-6e3b9c2f5a08";
export const ADAM_AI_CONTACT_ID = "a3f8d2b1-7c46-4e90-b5a2-1d9e6f0c3b74";

/** The thread's first message: the owner's own words, posted under the labeled AI name. */
export const ADAM_AI_OPENING_MESSAGE = [
  "Hey, welcome. I'm Adam. Thanks for stopping by.",
  "This site is a small desktop I built to show how I work, not just what I've shipped. A few places to start:",
  "1. Case studies in Safari: Grace at Providence, voice and SMS agents at Invoca, and ThoughtSpot",
  "2. My GitHub, linked in the footer of the Safari page, if you want to see how the site itself is put together",
  "3. Here: ask me anything about design, AI, or game audio",
  "So what brings you here today? Hiring, building something, or just curious?",
].join("\n\n");

/** The banner shows the opening line only; it clamps at two lines (~80 characters). */
export const ADAM_AI_BANNER_TEXT = "Hey, welcome. I'm Adam. Thanks for stopping by.";
