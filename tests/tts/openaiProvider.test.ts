import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAITTSProvider } from "../../src/shared/tts/providers/OpenAITTSProvider";

const provider = new OpenAITTSProvider();

describe("OpenAITTSProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires an API key before making a network request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(
      provider.synthesize({
        text: "Readable text only.",
        voiceId: "alloy",
        styleInstruction: "Read calmly.",
        speed: 1,
        format: "mp3",
        providerSettings: {}
      })
    ).rejects.toThrow("OpenAI API key");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends style instructions and cleaned text as the TTS input", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("audio", {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" }
      })
    );
    const objectUrlMock = vi.fn(() => "blob:pagevoice-test");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: objectUrlMock
    });

    const result = await provider.synthesize({
      text: "Reddit post: A useful title.\n\nTop comments.\n\nNext comment. This is the selected cleaned text.",
      voiceId: "nova",
      styleInstruction: "Read like a calm audiobook narrator.",
      speed: 1.1,
      format: "mp3",
      providerSettings: {
        openaiApiKey: "sk-test-secret",
        openaiModel: "gpt-4o-mini-tts"
      }
    });

    expect(result.audioUrl).toBe("blob:pagevoice-test");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "gpt-4o-mini-tts",
      voice: "nova",
      instructions: "Read like a calm audiobook narrator.",
      speed: 1.1,
      response_format: "mp3"
    });
    expect(body.input).toContain("Top comments.");
    expect(body.input).not.toContain("<html");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer sk-test-secret"
    });
    expect(objectUrlMock).toHaveBeenCalledOnce();
  });

  it("returns actionable rate-limit errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Too many requests" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      })
    );

    await expect(
      provider.synthesize({
        text: "Readable text only.",
        voiceId: "alloy",
        styleInstruction: "",
        speed: 1,
        format: "mp3",
        providerSettings: {
          openaiApiKey: "sk-test-secret"
        }
      })
    ).rejects.toThrow("rate limited");
  });

  it("exposes retry timing from OpenAI rate-limit responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Too many requests" } }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "2"
        }
      })
    );

    await expect(
      provider.synthesize({
        text: "Readable text only.",
        voiceId: "alloy",
        styleInstruction: "",
        speed: 1,
        format: "mp3",
        providerSettings: {
          openaiApiKey: "sk-test-secret"
        }
      })
    ).rejects.toMatchObject({ retryAfterMs: 2000 });
  });

  it("distinguishes quota and billing errors from temporary rate limits", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "You exceeded your current quota, please check your plan and billing details.",
            type: "insufficient_quota",
            code: "insufficient_quota"
          }
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    await expect(
      provider.synthesize({
        text: "Readable text only.",
        voiceId: "alloy",
        styleInstruction: "",
        speed: 1,
        format: "mp3",
        providerSettings: {
          openaiApiKey: "sk-test-secret"
        }
      })
    ).rejects.toThrow("quota or billing");
  });
});
