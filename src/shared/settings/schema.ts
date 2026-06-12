export type TTSProviderId = "browser-speech" | "openai" | "elevenlabs" | "local-kokoro";

export type RedditMode =
  | "post_only"
  | "post_top_comments"
  | "selected_comment"
  | "selected_thread"
  | "top_comments";

export type ThemeMode = "system" | "light" | "dark";

export interface PageVoiceSettings {
  version: 1;
  provider: TTSProviderId;
  voiceId: string;
  stylePresetId: string;
  customStyleInstruction: string;
  speed: number;
  redditMode: RedditMode;
  redditCommentLimit: number;
  readUsernames: boolean;
  readScores: boolean;
  readTimestamps: boolean;
  skipAutoModerator: boolean;
  skipDeletedRemoved: boolean;
  openaiApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  localProviderEnabled: boolean;
  theme: ThemeMode;
  aiVoiceDisclosureAcknowledged?: boolean;
}

export type PublicPageVoiceSettings = Omit<PageVoiceSettings, "openaiApiKey" | "elevenLabsApiKey"> & {
  openaiApiKeyConfigured: boolean;
  elevenLabsApiKeyConfigured: boolean;
};

export function sanitizeSettings(settings: PageVoiceSettings): PublicPageVoiceSettings {
  const { openaiApiKey, elevenLabsApiKey, ...safeSettings } = settings;
  return {
    ...safeSettings,
    openaiApiKeyConfigured: Boolean(openaiApiKey),
    elevenLabsApiKeyConfigured: Boolean(elevenLabsApiKey)
  };
}

export function normalizeSettings(input: Partial<PageVoiceSettings>, defaults: PageVoiceSettings): PageVoiceSettings {
  const provider = oneOf(input.provider, ["browser-speech", "openai", "elevenlabs", "local-kokoro"], defaults.provider);
  const redditMode = oneOf(
    input.redditMode,
    ["post_only", "post_top_comments", "selected_comment", "selected_thread", "top_comments"],
    defaults.redditMode
  );
  const theme = oneOf(input.theme, ["system", "light", "dark"], defaults.theme);
  return {
    ...defaults,
    ...input,
    version: 1,
    provider,
    redditMode,
    theme,
    speed: clamp(Number(input.speed ?? defaults.speed), 0.5, 2),
    redditCommentLimit: Math.max(1, Math.min(100, Number(input.redditCommentLimit ?? defaults.redditCommentLimit)))
  };
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}
