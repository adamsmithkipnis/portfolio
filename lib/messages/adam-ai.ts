/**
 * The AI stand-in for the site owner, the only persona that speaks as a living
 * person. The name carries no "(AI)" tag; the disclosure is in the opening
 * message itself, the contact's bio, and the prompt, which makes it say so when
 * asked.
 */
export const ADAM_AI_NAME = "Adam Smith-Kipnis";
export const ADAM_AI_CONVERSATION_ID = "0c5d1e7a-4b92-4f36-8a1d-6e3b9c2f5a08";
export const ADAM_AI_CONTACT_ID = "a3f8d2b1-7c46-4e90-b5a2-1d9e6f0c3b74";

/** The thread's first message: the owner's own words, which says up front that it is the AI version. */
export const ADAM_AI_OPENING_MESSAGE = [
  "Hey, welcome! I’m Adam! Sort of. I’m the AI version you can chat with 24/7, along with the others here. This site is a desktop simulation I built to show how I work, not just what I’ve shipped. Some things to check out:",
  "1. Case studies in Safari\n2. Spotify (the music actually plays from Spotify)\n3. My GitHub, which you can find in Finder under GitHub Projects",
  "So, what brings you here today? Are you hiring, building something, or just curious?",
].join("\n\n");

/** The banner text, a short version of the opening; it clamps at two lines (~80 characters). */
export const ADAM_AI_BANNER_TEXT = "Hey, welcome! I’m Adam. Sort of. The AI version of me anyway.";
