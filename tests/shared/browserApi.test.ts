import { describe, expect, it } from "vitest";
import type { BrowserApi } from "../../src/shared/browser/types";

describe("BrowserApi type contract", () => {
  it("describes the adapter shape used by extension contexts", () => {
    const api = {
      platform: "chromium",
      runtime: {
        getURL: (path: string) => `chrome-extension://id/${path}`,
        sendMessage: async <TResponse = unknown>() => ({ ok: true }) as TResponse,
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
        sendMessage: async <TResponse = unknown>() => ({ ok: true }) as TResponse
      }
    } satisfies BrowserApi;

    expect(api.runtime.getURL("sidepanel/index.html")).toContain("sidepanel");
  });
});
