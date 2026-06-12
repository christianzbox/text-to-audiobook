import type { TTSProvider, TTSRequest, TTSResult, Voice } from "../types";

export class LocalKokoroProvider implements TTSProvider {
  id = "local-kokoro";
  displayName = "Local Kokoro";
  supportsStreaming = false;
  supportsStyles = false;
  requiresApiKey = false;

  async listVoices(): Promise<Voice[]> {
    return [
      {
        id: "kokoro-planned",
        name: "Kokoro local voice planned",
        provider: this.id,
        description: "Experimental local TTS planned for WebGPU or a native companion.",
        tags: ["Experimental", "Local planned"]
      }
    ];
  }

  async synthesize(_request: TTSRequest): Promise<TTSResult> {
    throw new Error(
      "Local Kokoro TTS is planned but not enabled in this MVP. It requires model loading and likely WebGPU or a native companion app."
    );
  }
}
