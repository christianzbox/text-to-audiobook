import type { RuntimeMessage } from "./types";

type ChromeNamespace = typeof chrome;

function getChrome(): ChromeNamespace | undefined {
  const globals = globalThis as typeof globalThis & { chrome?: ChromeNamespace; browser?: ChromeNamespace };
  return globals.chrome ?? globals.browser;
}

export function sendRuntimeMessage<TResponse = unknown>(message: RuntimeMessage): Promise<TResponse> {
  const runtime = getChrome()?.runtime;
  if (!runtime?.sendMessage) {
    return Promise.reject(new Error("Runtime messaging is not available."));
  }
  return runtime.sendMessage(message) as Promise<TResponse>;
}

export function sendTabMessage<TResponse = unknown>(tabId: number, message: RuntimeMessage): Promise<TResponse> {
  const tabs = getChrome()?.tabs;
  if (!tabs?.sendMessage) {
    return Promise.reject(new Error("Tab messaging is not available."));
  }
  return tabs.sendMessage(tabId, message) as Promise<TResponse>;
}
