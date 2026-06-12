import { createChromiumBrowserApi } from "./chromium";
import { createFirefoxBrowserApi } from "./firefox";
import { createSafariBrowserApi } from "./safari";
import type { BrowserApi } from "./types";

type BrowserNamespace = typeof chrome;

function getRuntime(): BrowserNamespace["runtime"] | undefined {
  return (globalThis as typeof globalThis & { chrome?: BrowserNamespace; browser?: BrowserNamespace }).browser?.runtime
    ?? (globalThis as typeof globalThis & { chrome?: BrowserNamespace; browser?: BrowserNamespace }).chrome?.runtime;
}

export function createBrowserApi(): BrowserApi {
  const runtime = getRuntime();
  if (!runtime) {
    return createUnavailableBrowserApi();
  }
  const url = runtime?.getURL?.("") ?? "";
  const userAgent = globalThis.navigator?.userAgent ?? "";

  if (/Firefox/i.test(userAgent)) {
    return createFirefoxBrowserApi();
  }

  if (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edg/i.test(userAgent)) {
    return createSafariBrowserApi();
  }

  if (url.startsWith("moz-extension://")) {
    return createFirefoxBrowserApi();
  }

  return createChromiumBrowserApi();
}

export const browserApi = createBrowserApi();

function createUnavailableBrowserApi(): BrowserApi {
  const unavailable = <TResponse = unknown>() =>
    Promise.reject(new Error("Extension APIs are not available in this context.")) as Promise<TResponse>;
  return {
    platform: "unknown",
    runtime: {
      getURL: (path) => path,
      sendMessage: unavailable,
      onMessage: () => () => undefined
    },
    storage: {
      local: {
        get: async <T extends Record<string, unknown>>() => ({}) as T,
        set: async () => undefined,
        remove: async () => undefined
      }
    },
    tabs: {
      query: async () => [],
      sendMessage: unavailable
    }
  };
}
