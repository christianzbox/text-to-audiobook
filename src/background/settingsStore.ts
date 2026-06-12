import { browserApi } from "../shared/browser/browserApi";
import { DEFAULT_SETTINGS } from "../shared/settings/defaults";
import { normalizeSettings, sanitizeSettings, type PageVoiceSettings, type PublicPageVoiceSettings } from "../shared/settings/schema";

const SETTINGS_KEY = "pagevoice.settings";

export async function getSettings(): Promise<PageVoiceSettings> {
  const stored = await browserApi.storage.local.get<{ [SETTINGS_KEY]?: Partial<PageVoiceSettings> }>([SETTINGS_KEY]);
  return normalizeSettings(stored[SETTINGS_KEY] ?? {}, DEFAULT_SETTINGS);
}

export async function getPublicSettings(): Promise<PublicPageVoiceSettings> {
  return sanitizeSettings(await getSettings());
}

export async function updateSettings(patch: Partial<PageVoiceSettings>): Promise<PageVoiceSettings> {
  const current = await getSettings();
  const next = normalizeSettings({ ...current, ...patch }, DEFAULT_SETTINGS);
  await browserApi.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}
