import type { Voice } from "./types";

export const OPENAI_VOICES: Voice[] = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar"
].map((voice) => ({
  id: voice,
  name: voice[0].toUpperCase() + voice.slice(1),
  provider: "openai",
  language: "Multilingual",
  tags: ["AI-generated"]
}));

export const FALLBACK_BROWSER_VOICE: Voice = {
  id: "system-default",
  name: "System Default",
  provider: "browser-speech",
  description: "Uses the browser or operating system speech voice.",
  tags: ["Local/browser voice"]
};
