export interface Voice {
  id: string;
  name: string;
  provider: string;
  description?: string;
  gender?: string;
  language?: string;
  tags?: string[];
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  styleInstruction: string;
  speed: number;
  format: "mp3" | "opus" | "wav";
  providerSettings: Record<string, string | number | boolean | undefined>;
}

export interface TTSResult {
  audioBlob?: Blob;
  audioUrl?: string;
  mimeType: string;
  duration?: number;
  provider: string;
  voiceId: string;
  textHash: string;
}

export interface AudioChunk {
  bytes: Uint8Array;
  mimeType: string;
}

export interface TTSProvider {
  id: string;
  displayName: string;
  supportsStreaming: boolean;
  supportsStyles: boolean;
  requiresApiKey: boolean;
  listVoices(settings: Record<string, string | number | boolean | undefined>): Promise<Voice[]>;
  synthesize(request: TTSRequest): Promise<TTSResult>;
  synthesizeStream?(request: TTSRequest): AsyncIterable<AudioChunk>;
}
