import type { PageVoiceSettings, TTSProviderId } from "../../shared/settings/schema";
import { STYLE_PRESETS } from "../../shared/tts/stylePresets";
import type { Voice } from "../../shared/tts/types";

interface VoiceControlsProps {
  settings: PageVoiceSettings;
  voices: Voice[];
  onChange: (patch: Partial<PageVoiceSettings>) => void;
}

const PROVIDERS: Array<{ id: TTSProviderId; label: string }> = [
  { id: "browser-speech", label: "Browser Speech" },
  { id: "openai", label: "OpenAI" },
  { id: "elevenlabs", label: "ElevenLabs" },
  { id: "local-kokoro", label: "Local Kokoro" }
];

export function VoiceControls({ settings, voices, onChange }: VoiceControlsProps) {
  return (
    <section className="panel-section">
      <div className="section-title">Voice</div>
      <div className="field-grid">
        <label>
          <span>Provider</span>
          <select value={settings.provider} onChange={(event) => onChange({ provider: event.target.value as TTSProviderId })}>
            {PROVIDERS.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Voice</span>
          <select value={settings.voiceId} onChange={(event) => onChange({ voiceId: event.target.value })}>
            {voices.length === 0 ? <option value="">No voices loaded</option> : null}
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Style</span>
          <select value={settings.stylePresetId} onChange={(event) => onChange({ stylePresetId: event.target.value })}>
            {STYLE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Speed {settings.speed.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.speed}
            onChange={(event) => onChange({ speed: Number(event.target.value) })}
          />
        </label>
      </div>
      {settings.stylePresetId === "custom" ? (
        <label className="full-width-field">
          <span>Custom style</span>
          <textarea
            rows={3}
            value={settings.customStyleInstruction}
            onChange={(event) => onChange({ customStyleInstruction: event.target.value })}
          />
        </label>
      ) : null}
      {settings.provider !== "browser-speech" ? (
        <p className="disclosure">
          This voice is AI-generated. Cloud providers may bill per request and may rate limit long queues; generated chunks are cached for this panel session.
        </p>
      ) : null}
    </section>
  );
}
