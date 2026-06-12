import { stableHash } from "../../utils/hash";
import type { TTSProvider, TTSRequest, TTSResult, Voice } from "../types";
import { OPENAI_VOICES } from "../voiceCatalog";

export class OpenAITTSProvider implements TTSProvider {
  id = "openai";
  displayName = "OpenAI";
  supportsStreaming = false;
  supportsStyles = true;
  requiresApiKey = true;

  async listVoices(): Promise<Voice[]> {
    return OPENAI_VOICES;
  }

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    const apiKey = String(request.providerSettings.openaiApiKey ?? "");
    if (!apiKey) {
      throw new Error("Add an OpenAI API key in settings before using OpenAI voices.");
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: String(request.providerSettings.openaiModel ?? "gpt-4o-mini-tts"),
        voice: request.voiceId,
        input: request.text,
        instructions: request.styleInstruction || undefined,
        speed: request.speed,
        response_format: request.format
      })
    });

    if (!response.ok) {
      const message = await readError(response);
      if (response.status === 401) {
        throw new Error("OpenAI rejected the API key. Check the key and try again.");
      }
      if (response.status === 429) {
        throw new Error("OpenAI rate limited the request. Wait a moment and try again.");
      }
      throw new Error(message || `OpenAI TTS failed with HTTP ${response.status}.`);
    }

    const audioBlob = await response.blob();
    return {
      audioBlob,
      audioUrl: URL.createObjectURL(audioBlob),
      mimeType: audioBlob.type || "audio/mpeg",
      provider: this.id,
      voiceId: request.voiceId,
      textHash: stableHash(`${this.id}:${request.voiceId}:${request.styleInstruction}:${request.speed}:${request.text}`)
    };
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const json = await response.json();
    return json?.error?.message ?? "";
  } catch {
    return response.statusText;
  }
}
