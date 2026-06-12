import { stableHash } from "../../utils/hash";
import type { TTSProvider, TTSRequest, TTSResult, Voice } from "../types";

export class ElevenLabsProvider implements TTSProvider {
  id = "elevenlabs";
  displayName = "ElevenLabs";
  supportsStreaming = false;
  supportsStyles = false;
  requiresApiKey = true;

  async listVoices(settings: Record<string, string | number | boolean | undefined>): Promise<Voice[]> {
    const apiKey = String(settings.elevenLabsApiKey ?? "");
    const manualVoiceId = String(settings.elevenLabsVoiceId ?? "");
    if (!apiKey) {
      return manualVoiceId
        ? [{ id: manualVoiceId, name: "Manual ElevenLabs voice", provider: this.id, tags: ["Experimental"] }]
        : [];
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey
      }
    });
    if (!response.ok) {
      return manualVoiceId
        ? [{ id: manualVoiceId, name: "Manual ElevenLabs voice", provider: this.id, tags: ["Experimental"] }]
        : [];
    }
    const data = await response.json();
    const voices = Array.isArray(data.voices) ? data.voices : [];
    return voices.map((voice: { voice_id: string; name: string; labels?: Record<string, string> }) => ({
      id: voice.voice_id,
      name: voice.name,
      provider: this.id,
      tags: ["AI-generated", "Experimental", ...(voice.labels ? Object.values(voice.labels) : [])]
    }));
  }

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    const apiKey = String(request.providerSettings.elevenLabsApiKey ?? "");
    const voiceId = request.voiceId || String(request.providerSettings.elevenLabsVoiceId ?? "");
    if (!apiKey) {
      throw new Error("Add an ElevenLabs API key in settings before using ElevenLabs voices.");
    }
    if (!voiceId) {
      throw new Error("Enter an ElevenLabs voice ID in settings.");
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: request.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.25,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("ElevenLabs rejected the API key.");
      }
      if (response.status === 429) {
        throw new Error("ElevenLabs rate limited the request.");
      }
      throw new Error(`ElevenLabs TTS failed with HTTP ${response.status}.`);
    }

    const audioBlob = await response.blob();
    return {
      audioBlob,
      audioUrl: URL.createObjectURL(audioBlob),
      mimeType: audioBlob.type || "audio/mpeg",
      provider: this.id,
      voiceId,
      textHash: stableHash(`${this.id}:${voiceId}:${request.speed}:${request.text}`)
    };
  }
}
