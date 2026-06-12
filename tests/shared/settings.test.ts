import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../src/shared/settings/defaults";
import { normalizeSettings } from "../../src/shared/settings/schema";

describe("normalizeSettings", () => {
  it("migrates old partial settings onto the current version", () => {
    const settings = normalizeSettings({ provider: "openai", speed: 1.25 }, DEFAULT_SETTINGS);
    expect(settings.version).toBe(1);
    expect(settings.provider).toBe("openai");
    expect(settings.redditMode).toBe(DEFAULT_SETTINGS.redditMode);
  });

  it("clamps numeric settings and rejects invalid enum values", () => {
    const settings = normalizeSettings(
      {
        provider: "bad-provider",
        redditMode: "bad-mode",
        theme: "neon",
        speed: 8,
        redditCommentLimit: 999
      } as never,
      DEFAULT_SETTINGS
    );

    expect(settings.provider).toBe(DEFAULT_SETTINGS.provider);
    expect(settings.redditMode).toBe(DEFAULT_SETTINGS.redditMode);
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(settings.speed).toBe(2);
    expect(settings.redditCommentLimit).toBe(100);
  });
});
