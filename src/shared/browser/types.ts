import type { RuntimeMessage } from "../messages/types";

export interface BrowserTab {
  id?: number;
  title?: string;
  url?: string;
  windowId?: number;
}

export interface BrowserRuntimeSender {
  tab?: BrowserTab;
  url?: string;
  id?: string;
}

export interface BrowserStorageArea {
  get<T extends Record<string, unknown>>(keys?: string[] | Record<string, unknown> | null): Promise<T>;
  set(values: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export interface BrowserRuntimeApi {
  getURL(path: string): string;
  sendMessage<TResponse = unknown>(message: RuntimeMessage): Promise<TResponse>;
  onMessage(
    listener: (
      message: RuntimeMessage,
      sender: BrowserRuntimeSender,
      sendResponse: (response?: unknown) => void
    ) => boolean | void | unknown | Promise<unknown>
  ): () => void;
}

export interface BrowserTabsApi {
  query(queryInfo: { active?: boolean; currentWindow?: boolean; url?: string | string[] }): Promise<BrowserTab[]>;
  sendMessage<TResponse = unknown>(tabId: number, message: RuntimeMessage): Promise<TResponse>;
}

export interface BrowserCommandsApi {
  onCommand(listener: (command: string) => void): void;
}

export interface BrowserSidePanelApi {
  setPanelBehavior?(options: { openPanelOnActionClick: boolean }): Promise<void>;
  open?(options: { tabId?: number; windowId?: number }): Promise<void>;
}

export interface BrowserOffscreenApi {
  createDocument?(options: {
    url: string;
    reasons: string[];
    justification: string;
  }): Promise<void>;
  hasDocument?(): Promise<boolean>;
}

export interface BrowserActionApi {
  onClicked(listener: (tab: BrowserTab) => void): void;
}

export interface BrowserApi {
  runtime: BrowserRuntimeApi;
  storage: {
    local: BrowserStorageArea;
  };
  tabs: BrowserTabsApi;
  commands?: BrowserCommandsApi;
  sidePanel?: BrowserSidePanelApi;
  offscreen?: BrowserOffscreenApi;
  action?: BrowserActionApi;
  platform: "chromium" | "firefox" | "safari" | "unknown";
}
