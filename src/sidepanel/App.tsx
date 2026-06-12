import { WandSparkles, MousePointer2, TextCursorInput } from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { browserApi } from "../shared/browser/browserApi";
import { chunkText } from "../shared/extraction/chunker";
import type { Chunk, ExtractionResult, RedditExtractionOptions } from "../shared/extraction/types";
import type { AudioStatus, PageInfo, RuntimeMessage } from "../shared/messages/types";
import { DEFAULT_SETTINGS } from "../shared/settings/defaults";
import type { PageVoiceSettings, TTSProviderId } from "../shared/settings/schema";
import { resolveStyleInstruction } from "../shared/tts/stylePresets";
import type { TTSProvider, TTSRequest, Voice } from "../shared/tts/types";
import { BrowserSpeechProvider } from "../shared/tts/providers/BrowserSpeechProvider";
import { ElevenLabsProvider } from "../shared/tts/providers/ElevenLabsProvider";
import { LocalKokoroProvider } from "../shared/tts/providers/LocalKokoroProvider";
import { OpenAITTSProvider } from "../shared/tts/providers/OpenAITTSProvider";
import { stableHash } from "../shared/utils/hash";
import { estimateListeningSeconds, estimateWordCount } from "../shared/utils/timing";
import { Header } from "./components/Header";
import { VoiceControls } from "./components/VoiceControls";
import { PlaybackControls } from "./components/PlaybackControls";
import { QueuePanel } from "./components/QueuePanel";
import { ExtractedTextPreview } from "./components/ExtractedTextPreview";
import { SettingsPanel } from "./components/SettingsPanel";
import { RedditControls } from "./components/RedditControls";

const browserSpeech = new BrowserSpeechProvider();
const providerMap: Record<TTSProviderId, TTSProvider> = {
  "browser-speech": browserSpeech,
  openai: new OpenAITTSProvider(),
  elevenlabs: new ElevenLabsProvider(),
  "local-kokoro": new LocalKokoroProvider()
};

export default function App() {
  const [settings, setSettings] = useState<PageVoiceSettings>(DEFAULT_SETTINGS);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [queue, setQueue] = useState<Chunk[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [statusDetail, setStatusDetail] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTokenRef = useRef(0);
  const queueRef = useRef<Chunk[]>([]);
  const currentIndexRef = useRef(0);
  const cacheRef = useRef(new Map<string, string>());
  const inflightCacheRef = useRef(new Map<string, Promise<string>>());

  const provider = providerMap[settings.provider];
  const wordCount = estimateWordCount(previewText);
  const estimatedSeconds = estimateListeningSeconds(previewText);
  const canPlay = queue.length > 0 || Boolean(previewText.trim());

  const setStatusSafe = useCallback((nextStatus: AudioStatus, detail = "") => {
    setStatus(nextStatus);
    setStatusDetail(detail);
    void browserApi.runtime.sendMessage({ type: "AUDIO_STATUS_UPDATE", status: nextStatus, detail });
  }, []);

  const updateSettings = useCallback(async (patch: Partial<PageVoiceSettings>) => {
    const next = await browserApi.runtime.sendMessage<PageVoiceSettings>({ type: "SETTINGS_UPDATE", patch });
    setSettings(next);
  }, []);

  const sendActiveTabMessage = useCallback(async <TResponse,>(message: RuntimeMessage): Promise<TResponse> => {
    const [tab] = await browserApi.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error("Open a normal webpage before using PageVoice.");
    }
    if (!tab.url || /^(chrome|edge|about|moz-extension|chrome-extension):/i.test(tab.url)) {
      throw new Error("PageVoice cannot run on browser internal pages.");
    }
    return browserApi.tabs.sendMessage<TResponse>(tab.id, message);
  }, []);

  const refreshPageInfo = useCallback(async () => {
    try {
      const info = await sendActiveTabMessage<PageInfo>({ type: "GET_PAGE_INFO" });
      setPageInfo(info);
    } catch (error) {
      setPageInfo(null);
      setStatusSafe("error", error instanceof Error ? error.message : "Could not read the active page.");
    }
  }, [sendActiveTabMessage, setStatusSafe]);

  useEffect(() => {
    let cancelled = false;

    void browserApi.runtime
      .sendMessage<PageVoiceSettings>({ type: "SETTINGS_GET", includeSecrets: true })
      .then((next) => {
        if (!cancelled) {
          setSettings(next);
        }
      });

    void sendActiveTabMessage<PageInfo>({ type: "GET_PAGE_INFO" })
      .then((info) => {
        if (!cancelled) {
          setPageInfo(info);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPageInfo(null);
          setStatusSafe("error", error instanceof Error ? error.message : "Could not read the active page.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sendActiveTabMessage, setStatusSafe]);

  useEffect(() => {
    let cancelled = false;
    void provider
      .listVoices({
        openaiApiKey: settings.openaiApiKey,
        elevenLabsApiKey: settings.elevenLabsApiKey,
        elevenLabsVoiceId: settings.elevenLabsVoiceId
      })
      .then((nextVoices) => {
        if (cancelled) {
          return;
        }
        setVoices(nextVoices);
        if (nextVoices.length && !nextVoices.some((voice) => voice.id === settings.voiceId)) {
          void updateSettings({ voiceId: nextVoices[0].id });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatusSafe("error", error instanceof Error ? error.message : "Could not load voices.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [provider, settings.elevenLabsApiKey, settings.elevenLabsVoiceId, settings.openaiApiKey, settings.voiceId, setStatusSafe, updateSettings]);

  const handleRuntimeMessage = useEffectEvent((message: RuntimeMessage) => {
      if (message.type === "PICKER_SELECTED_BLOCK") {
        setPreviewText(message.block.text);
        const chunks = chunkText(message.block.text);
        if (message.action === "queue") {
          appendQueueState(chunks);
          setStatusSafe("ready", "Picked text was added to the queue.");
        } else {
          setQueueState(chunks);
          setStatusSafe("ready", "Picked text is ready.");
        }
      } else if (message.type === "PLAY") {
        void playQueue();
      } else if (message.type === "PAUSE") {
        pausePlayback();
      } else if (message.type === "RESUME") {
        resumePlayback();
      } else if (message.type === "STOP") {
        stopPlayback();
      } else if (message.type === "NEXT") {
        void nextChunk();
      }
  });

  useEffect(() => {
    return browserApi.runtime.onMessage(handleRuntimeMessage);
  }, []);

  const redditOptions: Partial<RedditExtractionOptions> = useMemo(
    () => ({
      mode: settings.redditMode,
      commentLimit: settings.redditCommentLimit,
      readUsernames: settings.readUsernames,
      readScores: settings.readScores,
      readTimestamps: settings.readTimestamps,
      skipAutoModerator: settings.skipAutoModerator,
      skipDeletedRemoved: settings.skipDeletedRemoved
    }),
    [settings]
  );

  async function readPage(): Promise<void> {
    await runExtraction({ type: "EXTRACT_PAGE", redditOptions });
  }

  async function readSelectedText(): Promise<void> {
    await runExtraction({ type: "EXTRACT_SELECTION" });
  }

  async function runExtraction(message: RuntimeMessage): Promise<void> {
    try {
      setStatusSafe("extracting", "Extracting readable text.");
      const result = await sendActiveTabMessage<ExtractionResult>(message);
      applyExtraction(result);
    } catch (error) {
      setStatusSafe("error", error instanceof Error ? error.message : "Extraction failed.");
    }
  }

  async function startPicker(): Promise<void> {
    try {
      await sendActiveTabMessage<{ ok: true }>({ type: "START_PICKER" });
      setStatusSafe("extracting", "Picker is active.");
    } catch (error) {
      setStatusSafe("error", error instanceof Error ? error.message : "Picker could not start.");
    }
  }

  function applyExtraction(result: ExtractionResult): void {
    setPreviewText(result.fullText);
    const chunks = chunkText(result.fullText);
    setQueueState(chunks);
    setStatusSafe(result.fullText ? "ready" : "error", result.warnings[0] ?? `${result.extractorName} extracted ${chunks.length} chunks.`);
  }

  function setQueueState(chunks: Chunk[]): void {
    queueRef.current = chunks;
    currentIndexRef.current = 0;
    setQueue(chunks);
    setCurrentIndex(0);
  }

  function appendQueueState(chunks: Chunk[]): void {
    const offset = queueRef.current.length;
    const nextChunks = [
      ...queueRef.current,
      ...chunks.map((chunk, index) => ({
        ...chunk,
        id: `${chunk.id}-queued-${offset + index}`,
        index: offset + index
      }))
    ];
    queueRef.current = nextChunks;
    setQueue(nextChunks);
  }

  function queuePreview(): void {
    const chunks = chunkText(previewText);
    setQueueState(chunks);
    setStatusSafe(chunks.length ? "ready" : "error", chunks.length ? "Text added to queue." : "No text to queue.");
  }

  function buildRequest(text: string): TTSRequest {
    return {
      text,
      voiceId: settings.voiceId,
      styleInstruction: resolveStyleInstruction(settings.stylePresetId, settings.customStyleInstruction),
      speed: settings.speed,
      format: "mp3",
      providerSettings: {
        openaiApiKey: settings.openaiApiKey,
        openaiModel: "gpt-4o-mini-tts",
        elevenLabsApiKey: settings.elevenLabsApiKey,
        elevenLabsVoiceId: settings.elevenLabsVoiceId
      }
    };
  }

  async function playQueue(startAt = currentIndexRef.current): Promise<void> {
    let activeQueue = queueRef.current;
    if (!activeQueue.length && previewText.trim()) {
      activeQueue = chunkText(previewText);
      setQueueState(activeQueue);
    }
    if (!activeQueue.length) {
      setStatusSafe("error", "No text is ready to play.");
      return;
    }

    const token = playTokenRef.current + 1;
    playTokenRef.current = token;
    setStatusSafe("playing", "Playing.");

    for (let index = startAt; index < activeQueue.length; index += 1) {
      if (playTokenRef.current !== token) {
        return;
      }
      currentIndexRef.current = index;
      setCurrentIndex(index);
      try {
        await playChunk(activeQueue[index], token);
      } catch (error) {
        if (playTokenRef.current === token) {
          setStatusSafe("error", error instanceof Error ? error.message : "Playback failed.");
        }
        return;
      }
    }

    if (playTokenRef.current === token) {
      setStatusSafe("ready", "Playback complete.");
    }
  }

  async function playChunk(chunk: Chunk, token: number): Promise<void> {
    const request = buildRequest(chunk.text);
    if (settings.provider === "browser-speech") {
      await browserSpeech.speak(request);
      return;
    }

    setStatusSafe("generating", `Preparing chunk ${chunk.index + 1}.`);
    const audioPromise = ensureAudioUrl(chunk, request);
    prefetchChunk(chunk.index + 1);
    const audioUrl = await audioPromise;

    if (playTokenRef.current !== token) {
      return;
    }
    setStatusSafe("playing", `Playing chunk ${chunk.index + 1}.`);
    await playAudioUrl(audioUrl, token);
  }

  function prefetchChunk(index: number): void {
    if (settings.provider === "browser-speech" || settings.provider === "local-kokoro") {
      return;
    }
    const nextChunk = queueRef.current[index];
    if (!nextChunk) {
      return;
    }
    const request = buildRequest(nextChunk.text);
    void ensureAudioUrl(nextChunk, request).catch(() => undefined);
  }

  function ensureAudioUrl(chunk: Chunk, request: TTSRequest): Promise<string> {
    const cacheKey = getAudioCacheKey(chunk.text, request);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
    const inflight = inflightCacheRef.current.get(cacheKey);
    if (inflight) {
      return inflight;
    }

    const next = synthesizeWithRetry(request)
      .then((audioUrl) => {
        cacheRef.current.set(cacheKey, audioUrl);
        return audioUrl;
      })
      .finally(() => {
        inflightCacheRef.current.delete(cacheKey);
      });
    inflightCacheRef.current.set(cacheKey, next);
    return next;
  }

  async function synthesizeWithRetry(request: TTSRequest): Promise<string> {
    const maxAttempts = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await provider.synthesize(request);
        if (!result.audioUrl) {
          throw new Error(`${provider.displayName} did not return playable audio.`);
        }
        return result.audioUrl;
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts || !isRetryableProviderError(error)) {
          break;
        }
        await delay(350 * 2 ** (attempt - 1));
      }
    }
    const message = lastError instanceof Error ? lastError.message : "Unknown provider error.";
    throw new Error(`${provider.displayName} could not generate audio. ${message}`);
  }

  function getAudioCacheKey(text: string, request: TTSRequest): string {
    return stableHash(
      [
        settings.provider,
        request.voiceId,
        request.styleInstruction,
        request.speed,
        request.format,
        text
      ].join("\n---\n")
    );
  }

  function playAudioUrl(audioUrl: string, token: number): Promise<void> {
    audioRef.current?.pause();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed."));
      void audio.play().catch(reject);
      const interval = window.setInterval(() => {
        if (playTokenRef.current !== token) {
          window.clearInterval(interval);
          audio.pause();
          resolve();
        }
      }, 150);
    });
  }

  function pausePlayback(): void {
    if (settings.provider === "browser-speech") {
      browserSpeech.pause();
    } else {
      audioRef.current?.pause();
    }
    setStatusSafe("paused", "Paused.");
  }

  function resumePlayback(): void {
    if (settings.provider === "browser-speech") {
      browserSpeech.resume();
    } else {
      void audioRef.current?.play();
    }
    setStatusSafe("playing", "Playing.");
  }

  function stopPlayback(): void {
    playTokenRef.current += 1;
    browserSpeech.stop();
    audioRef.current?.pause();
    audioRef.current = null;
    setStatusSafe("ready", "Stopped.");
  }

  async function nextChunk(): Promise<void> {
    const wasPlaying = status === "playing" || status === "generating";
    playTokenRef.current += 1;
    browserSpeech.stop();
    audioRef.current?.pause();
    const nextIndex = Math.min(currentIndexRef.current + 1, Math.max(0, queueRef.current.length - 1));
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    if (wasPlaying) {
      await playQueue(nextIndex);
    } else {
      setStatusSafe("ready", `Selected chunk ${nextIndex + 1}.`);
    }
  }

  function clearQueue(): void {
    stopPlayback();
    setQueueState([]);
    setStatusSafe("idle", "Queue cleared.");
  }

  function selectQueueIndex(index: number): void {
    currentIndexRef.current = index;
    setCurrentIndex(index);
  }

  return (
    <main className="app-shell">
      <Header pageInfo={pageInfo} provider={settings.provider} onRefresh={refreshPageInfo} />
      <section className="panel-section hero-controls">
        <div className="button-row">
          <button type="button" className="primary-button" onClick={() => void readPage()}>
            <WandSparkles size={16} />
            Read page
          </button>
          <button type="button" onClick={() => void startPicker()}>
            <MousePointer2 size={16} />
            Pick text
          </button>
          <button type="button" onClick={() => void readSelectedText()}>
            <TextCursorInput size={16} />
            Read selected text
          </button>
        </div>
        <div className={`status-pill status-${status}`}>
          <span>{status}</span>
          {statusDetail ? <small>{statusDetail}</small> : null}
        </div>
      </section>
      <VoiceControls settings={settings} voices={voices} onChange={(patch) => void updateSettings(patch)} />
      {pageInfo?.isReddit ? <RedditControls settings={settings} onChange={(patch) => void updateSettings(patch)} /> : null}
      <ExtractedTextPreview
        text={previewText}
        wordCount={wordCount}
        seconds={estimatedSeconds}
        onChange={setPreviewText}
        onQueue={queuePreview}
        onRead={() => {
          queuePreview();
          void playQueue(0);
        }}
      />
      <PlaybackControls
        status={status}
        canPlay={canPlay}
        onPlay={() => void playQueue(currentIndexRef.current)}
        onPauseResume={() => (status === "paused" ? resumePlayback() : pausePlayback())}
        onStop={stopPlayback}
        onNext={() => void nextChunk()}
        onClear={clearQueue}
      />
      <QueuePanel chunks={queue} currentIndex={currentIndex} onSelect={selectQueueIndex} />
      <SettingsPanel settings={settings} onChange={(patch) => void updateSettings(patch)} />
    </main>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRetryableProviderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (/api key|rejected|missing|invalid voice|not enabled/.test(message)) {
    return false;
  }
  return /rate|429|network|timeout|temporar|failed|503|502|500/.test(message);
}
