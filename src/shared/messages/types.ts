import type { ExtractionResult, ReadableBlock, RedditExtractionOptions } from "../extraction/types";
import type { PageVoiceSettings, PublicPageVoiceSettings } from "../settings/schema";

export interface PageInfo {
  title: string;
  url: string;
  isReddit: boolean;
  isHackerNews: boolean;
}

export type AudioStatus = "idle" | "extracting" | "ready" | "generating" | "playing" | "paused" | "error";

export type RuntimeMessage =
  | { type: "OPEN_PANEL" }
  | { type: "GET_PAGE_INFO" }
  | { type: "PAGE_INFO"; pageInfo: PageInfo }
  | { type: "START_PICKER" }
  | { type: "CANCEL_PICKER" }
  | { type: "PICKER_SELECTED_BLOCK"; block: ReadableBlock; action?: "read" | "queue" }
  | { type: "EXTRACT_PAGE"; redditOptions?: Partial<RedditExtractionOptions> }
  | { type: "EXTRACT_SELECTION" }
  | { type: "EXTRACTION_RESULT"; result: ExtractionResult }
  | { type: "QUEUE_TEXT"; text: string; title?: string; sourceUrl?: string }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "NEXT" }
  | { type: "CLEAR_QUEUE" }
  | { type: "SETTINGS_GET"; includeSecrets?: boolean }
  | { type: "SETTINGS_VALUE"; settings: PageVoiceSettings | PublicPageVoiceSettings }
  | { type: "SETTINGS_UPDATE"; patch: Partial<PageVoiceSettings> }
  | { type: "TTS_SYNTHESIZE"; text: string }
  | { type: "TTS_ERROR"; error: string }
  | { type: "AUDIO_STATUS_UPDATE"; status: AudioStatus; detail?: string };

export interface MessageResponseMap {
  GET_PAGE_INFO: PageInfo;
  START_PICKER: { ok: true };
  CANCEL_PICKER: { ok: true };
  EXTRACT_PAGE: ExtractionResult;
  EXTRACT_SELECTION: ExtractionResult;
  SETTINGS_GET: PageVoiceSettings | PublicPageVoiceSettings;
  SETTINGS_UPDATE: PageVoiceSettings | PublicPageVoiceSettings;
}

export type MessageOfType<TType extends RuntimeMessage["type"]> = Extract<RuntimeMessage, { type: TType }>;
