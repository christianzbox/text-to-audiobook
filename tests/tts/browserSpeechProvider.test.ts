import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserSpeechProvider } from "../../src/shared/tts/providers/BrowserSpeechProvider";

function createVoice(name: string): SpeechSynthesisVoice {
  return {
    default: false,
    lang: "en-US",
    localService: true,
    name,
    voiceURI: `voice:${name}`
  } as SpeechSynthesisVoice;
}

describe("BrowserSpeechProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lists loaded browser voices", async () => {
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => [createVoice("Samantha")]
    });

    const voices = await new BrowserSpeechProvider().listVoices();

    expect(voices[0]).toMatchObject({
      id: "voice:Samantha",
      name: "Samantha",
      provider: "browser-speech"
    });
  });

  it("waits briefly for voiceschanged before falling back", async () => {
    vi.useFakeTimers();
    const loadedVoices = [createVoice("Alex")];
    let voices: SpeechSynthesisVoice[] = [];
    let listener: (() => void) | undefined;
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => voices,
      addEventListener: (_event: string, callback: () => void) => {
        listener = callback;
      },
      removeEventListener: vi.fn(),
      onvoiceschanged: null
    });

    const promise = new BrowserSpeechProvider().listVoices();
    voices = loadedVoices;
    listener?.();

    await expect(promise).resolves.toEqual([
      expect.objectContaining({
        id: "voice:Alex",
        name: "Alex"
      })
    ]);
  });
});
