import { browserApi } from "../shared/browser/browserApi";
import type { BrowserRuntimeSender } from "../shared/browser/types";
import type { RuntimeMessage } from "../shared/messages/types";
import { sanitizeSettings } from "../shared/settings/schema";
import { getSettings, updateSettings } from "./settingsStore";
import { setAudioState } from "./ttsCoordinator";

export function registerMessageRouter(): void {
  browserApi.runtime.onMessage(async (message: RuntimeMessage, sender: BrowserRuntimeSender) => {
    switch (message.type) {
      case "OPEN_PANEL":
        await openPanelForSender(sender);
        return { ok: true };
      case "SETTINGS_GET": {
        const settings = await getSettings();
        return sender.tab ? sanitizeSettings(settings) : settings;
      }
      case "SETTINGS_UPDATE": {
        const settings = await updateSettings(message.patch);
        return sender.tab ? sanitizeSettings(settings) : settings;
      }
      case "AUDIO_STATUS_UPDATE":
        return setAudioState(message.status, message.detail);
      default:
        return undefined;
    }
  });
}

export async function openPanelForSender(sender: BrowserRuntimeSender): Promise<void> {
  if (browserApi.sidePanel?.open) {
    if (sender.tab?.id) {
      await browserApi.sidePanel.open({ tabId: sender.tab.id });
      return;
    }
    if (sender.tab?.windowId) {
      await browserApi.sidePanel.open({ windowId: sender.tab.windowId });
      return;
    }
  }
}
