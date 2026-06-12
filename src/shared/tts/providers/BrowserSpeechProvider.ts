import { stableHash } from "../../utils/hash";
import type { TTSProvider, TTSRequest, TTSResult, Voice } from "../types";
import { FALLBACK_BROWSER_VOICE } from "../voiceCatalog";

export class BrowserSpeechProvider implements TTSProvider {
  id = "browser-speech";
  displayName = "Browser Speech";
  supportsStreaming = false;
  supportsStyles = false;
  requiresApiKey = false;

  async listVoices(): Promise<Voice[]> {
    if (!globalThis.speechSynthesis) {
      return [FALLBACK_BROWSER_VOICE];
    }
    const voices = globalThis.speechSynthesis.getVoices();
    if (!voices.length) {
      return [FALLBACK_BROWSER_VOICE];
    }
    return voices.map((voice) => ({
      id: voice.voiceURI || voice.name,
      name: voice.name,
      provider: this.id,
      language: voice.lang,
      tags: [voice.localService ? "Local/browser voice" : "Browser voice"]
    }));
  }

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    return {
      mimeType: "text/plain",
      provider: this.id,
      voiceId: request.voiceId,
      textHash: stableHash(`${this.id}:${request.voiceId}:${request.speed}:${request.text}`)
    };
  }

  speak(request: TTSRequest): Promise<void> {
    if (!globalThis.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      return Promise.reject(new Error("Browser speech is not available in this context."));
    }

    globalThis.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.rate = request.speed;

    const voices = globalThis.speechSynthesis.getVoices();
    const voice = voices.find((candidate) => candidate.voiceURI === request.voiceId || candidate.name === request.voiceId);
    if (voice) {
      utterance.voice = voice;
    }

    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error || "Browser speech failed."));
      globalThis.speechSynthesis.speak(utterance);
    });
  }

  pause(): void {
    globalThis.speechSynthesis?.pause();
  }

  resume(): void {
    globalThis.speechSynthesis?.resume();
  }

  stop(): void {
    globalThis.speechSynthesis?.cancel();
  }
}
