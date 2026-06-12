import type { RuntimeMessage } from "../messages/types";
import type { BrowserApi, BrowserRuntimeSender, BrowserTab } from "./types";

type ChromeNamespace = typeof chrome;

function getChrome(): ChromeNamespace | undefined {
  const globals = globalThis as typeof globalThis & { chrome?: ChromeNamespace; browser?: ChromeNamespace };
  return globals.chrome ?? globals.browser;
}

function normalizeTab(tab: chrome.tabs.Tab): BrowserTab {
  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
    windowId: tab.windowId
  };
}

function normalizeSender(sender: chrome.runtime.MessageSender): BrowserRuntimeSender {
  return {
    tab: sender.tab ? normalizeTab(sender.tab) : undefined,
    url: sender.url,
    id: sender.id
  };
}

export function createChromiumBrowserApi(): BrowserApi {
  const chromeApi = getChrome();
  if (!chromeApi) {
    throw new Error("chrome.* APIs are not available in this context.");
  }

  return {
    platform: "chromium",
    runtime: {
      getURL: (path) => chromeApi.runtime.getURL(path),
      sendMessage: (message) => chromeApi.runtime.sendMessage(message),
      onMessage: (listener) => {
        const wrappedListener = (
          message: unknown,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: unknown) => void
        ) => {
          const result = listener(message as RuntimeMessage, normalizeSender(sender), sendResponse);
          if (result instanceof Promise) {
            result.then(sendResponse).catch((error: unknown) => {
              sendResponse({
                error: error instanceof Error ? error.message : "Unknown message error"
              });
            });
            return true;
          }
          if (result !== undefined && typeof result !== "boolean") {
            sendResponse(result);
            return false;
          }
          return result === true;
        };
        chromeApi.runtime.onMessage.addListener(wrappedListener);
        return () => chromeApi.runtime.onMessage.removeListener(wrappedListener);
      }
    },
    storage: {
      local: {
        get: (keys) => chromeApi.storage.local.get((keys ?? null) as never) as unknown as Promise<never>,
        set: (values) => chromeApi.storage.local.set(values),
        remove: (keys) => chromeApi.storage.local.remove(keys)
      }
    },
    tabs: {
      query: async (queryInfo) => {
        const tabs = await chromeApi.tabs.query(queryInfo);
        return tabs.map(normalizeTab);
      },
      sendMessage: (tabId, message) => chromeApi.tabs.sendMessage(tabId, message) as Promise<never>
    },
    commands: chromeApi.commands
      ? {
          onCommand: (listener) => chromeApi.commands.onCommand.addListener(listener)
        }
      : undefined,
    sidePanel: chromeApi.sidePanel
      ? {
          setPanelBehavior: (options) => chromeApi.sidePanel.setPanelBehavior(options),
          open: (options) => chromeApi.sidePanel.open(options as chrome.sidePanel.OpenOptions)
        }
      : undefined,
    offscreen: chromeApi.offscreen
      ? {
          createDocument: (options) => chromeApi.offscreen.createDocument(options as chrome.offscreen.CreateParameters),
          hasDocument: () => chromeApi.offscreen.hasDocument()
        }
      : undefined,
    action: chromeApi.action
      ? {
          onClicked: (listener) => chromeApi.action.onClicked.addListener((tab) => listener(normalizeTab(tab)))
        }
      : undefined
  };
}
