import { Cloud, Cpu, Gauge, Mic2, Sparkles, Volume2, type LucideIcon } from "lucide-react";
import type { PageVoiceSettings, TTSProviderId } from "../../shared/settings/schema";
import { STYLE_PRESETS } from "../../shared/tts/stylePresets";
import type { Voice } from "../../shared/tts/types";

interface VoiceControlsProps {
  settings: PageVoiceSettings;
  voices: Voice[];
  onChange: (patch: Partial<PageVoiceSettings>) => void;
}

const PROVIDERS: Array<{ id: TTSProviderId; label: string; shortLabel: string; icon: LucideIcon }> = [
  { id: "browser-speech", label: "Browser Speech", shortLabel: "Local", icon: Volume2 },
  { id: "openai", label: "OpenAI", shortLabel: "OpenAI", icon: Sparkles },
  { id: "elevenlabs", label: "ElevenLabs", shortLabel: "11Labs", icon: Cloud },
  { id: "local-kokoro", label: "Local Kokoro", shortLabel: "Kokoro", icon: Cpu }
];

export function VoiceControls({ settings, voices, onChange }: VoiceControlsProps) {
  const activeProvider = PROVIDERS.find((provider) => provider.id === settings.provider) ?? PROVIDERS[0];
  const isCloudProvider = settings.provider === "openai" || settings.provider === "elevenlabs";
  const showStyle = settings.provider === "openai";
  const missingOpenAIKey = settings.provider === "openai" && !settings.openaiApiKey;
  const missingElevenLabsKey = settings.provider === "elevenlabs" && !settings.elevenLabsApiKey;
  const emptyVoiceLabel = settings.provider === "elevenlabs" ? "Add API key below" : "No voices loaded";

  return (
    <section className="panel-section voice-panel">
      <div className="voice-panel-header">
        <div className="section-title with-icon">
          <Mic2 size={16} />
          Narrator
        </div>
        <span className={isCloudProvider ? "voice-source cloud" : "voice-source"}>
          {isCloudProvider ? "Cloud AI" : activeProvider.id === "local-kokoro" ? "Local planned" : "Local"}
        </span>
      </div>
      <div className="provider-segment" role="radiogroup" aria-label="Voice provider">
        {PROVIDERS.map((provider) => {
          const Icon = provider.icon;
          const isActive = provider.id === settings.provider;
          return (
            <button
              key={provider.id}
              type="button"
              className={isActive ? "provider-option active" : "provider-option"}
              aria-pressed={isActive}
              title={provider.label}
              onClick={() => onChange({ provider: provider.id })}
            >
              <Icon size={15} />
              <span>{provider.shortLabel}</span>
            </button>
          );
        })}
      </div>
      <div className="voice-control-grid">
        <label className="voice-field">
          <span>Voice</span>
          <select value={settings.voiceId} onChange={(event) => onChange({ voiceId: event.target.value })}>
            {voices.length === 0 ? <option value={settings.voiceId || ""}>{emptyVoiceLabel}</option> : null}
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </label>
        {showStyle ? (
          <label className="voice-field">
            <span>Style</span>
            <select value={settings.stylePresetId} onChange={(event) => onChange({ stylePresetId: event.target.value })}>
              {STYLE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={showStyle ? "speed-control full" : "speed-control"}>
          <span>
            <Gauge size={14} />
            Speed
          </span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.speed}
            onChange={(event) => onChange({ speed: Number(event.target.value) })}
          />
          <output>{settings.speed.toFixed(1)}x</output>
        </label>
      </div>
      {showStyle && settings.stylePresetId === "custom" ? (
        <label className="full-width-field">
          <span>Custom style</span>
          <textarea
            rows={3}
            value={settings.customStyleInstruction}
            onChange={(event) => onChange({ customStyleInstruction: event.target.value })}
          />
        </label>
      ) : null}
      {missingOpenAIKey ? <p className="voice-warning">OpenAI key needed in Settings.</p> : null}
      {missingElevenLabsKey ? <p className="voice-warning">ElevenLabs key needed in Settings.</p> : null}
      {isCloudProvider ? <p className="disclosure">AI-generated voice. Cloud providers may bill per request.</p> : null}
    </section>
  );
}
