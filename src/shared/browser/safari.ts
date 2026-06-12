import { createChromiumBrowserApi } from "./chromium";
import type { BrowserApi } from "./types";

export function createSafariBrowserApi(): BrowserApi {
  const api = createChromiumBrowserApi();
  return {
    ...api,
    platform: "safari",
    sidePanel: undefined,
    offscreen: undefined
  };
}
