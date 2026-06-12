import type { PageVoiceSettings } from "./schema";

export const DEFAULT_SETTINGS: PageVoiceSettings = {
  version: 1,
  provider: "browser-speech",
  voiceId: "system-default",
  stylePresetId: "calm-audiobook",
  customStyleInstruction: "",
  speed: 1,
  redditMode: "post_top_comments",
  redditCommentLimit: 8,
  readUsernames: false,
  readScores: false,
  readTimestamps: false,
  skipAutoModerator: true,
  skipDeletedRemoved: true,
  openaiApiKey: "",
  elevenLabsApiKey: "",
  elevenLabsVoiceId: "",
  localProviderEnabled: false,
  theme: "system",
  aiVoiceDisclosureAcknowledged: false
};
