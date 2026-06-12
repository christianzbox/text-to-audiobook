import { createChromiumBrowserApi } from "./chromium";
import type { BrowserApi } from "./types";

export function createFirefoxBrowserApi(): BrowserApi {
  const api = createChromiumBrowserApi();
  return {
    ...api,
    platform: "firefox",
    sidePanel: undefined,
    offscreen: undefined
  };
}
