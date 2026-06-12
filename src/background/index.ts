import { browserApi } from "../shared/browser/browserApi";
import { logger } from "../shared/utils/logger";
import { registerMessageRouter } from "./messageRouter";

registerMessageRouter();

void browserApi.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch((error: unknown) => {
  logger.warn("Side panel behavior is not available.", error);
});

browserApi.action?.onClicked((tab) => {
  if (!browserApi.sidePanel?.open) {
    return;
  }
  void browserApi.sidePanel.open({ tabId: tab.id, windowId: tab.windowId }).catch((error: unknown) => {
    logger.warn("Could not open side panel.", error);
  });
});

browserApi.commands?.onCommand((command) => {
  void handleCommand(command);
});

async function handleCommand(command: string): Promise<void> {
  const [tab] = await browserApi.tabs.query({ active: true, currentWindow: true });
  if (command === "toggle-panel") {
    if (browserApi.sidePanel?.open) {
      await browserApi.sidePanel.open({ tabId: tab?.id, windowId: tab?.windowId });
    }
    return;
  }

  if (!tab?.id) {
    return;
  }

  if (command === "pick-text") {
    await browserApi.tabs.sendMessage(tab.id, { type: "START_PICKER" });
  } else if (command === "play-pause") {
    await browserApi.runtime.sendMessage({ type: "PAUSE" });
  } else if (command === "stop") {
    await browserApi.runtime.sendMessage({ type: "STOP" });
  }
}
