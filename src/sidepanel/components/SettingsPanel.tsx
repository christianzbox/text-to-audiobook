import { EyeOff, KeyRound, Trash2 } from "lucide-react";
import { useRef } from "react";
import type { PageVoiceSettings } from "../../shared/settings/schema";

interface SettingsPanelProps {
  settings: PageVoiceSettings;
  onChange: (patch: Partial<PageVoiceSettings>) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function exportSettings(): void {
    const { openaiApiKey: _openaiApiKey, elevenLabsApiKey: _elevenLabsApiKey, ...safeSettings } = settings;
    const blob = new Blob([JSON.stringify(safeSettings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pagevoice-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importSettings(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<PageVoiceSettings>;
    onChange(parsed);
  }

  return (
    <section className="panel-section">
      <div className="section-title with-icon">
        <KeyRound size={16} />
        Settings
      </div>
      <label className="full-width-field">
        <span>OpenAI API key</span>
        <input
          type="password"
          value={settings.openaiApiKey}
          autoComplete="off"
          onChange={(event) => onChange({ openaiApiKey: event.target.value })}
        />
      </label>
      <label className="full-width-field">
        <span>ElevenLabs API key</span>
        <input
          type="password"
          value={settings.elevenLabsApiKey}
          autoComplete="off"
          onChange={(event) => onChange({ elevenLabsApiKey: event.target.value })}
        />
      </label>
      <label className="full-width-field">
        <span>ElevenLabs voice ID</span>
        <input
          value={settings.elevenLabsVoiceId}
          onChange={(event) => onChange({ elevenLabsVoiceId: event.target.value })}
        />
      </label>
      <div className="field-grid">
        <label>
          <span>Theme</span>
          <select value={settings.theme} onChange={(event) => onChange({ theme: event.target.value as PageVoiceSettings["theme"] })}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settings.localProviderEnabled}
            onChange={(event) => onChange({ localProviderEnabled: event.target.checked })}
          />
          <span>Local provider flag</span>
        </label>
      </div>
      <div className="button-row compact">
        <button type="button" onClick={() => onChange({ openaiApiKey: "" })}>
          <Trash2 size={16} />
          Remove OpenAI key
        </button>
        <button type="button" onClick={() => onChange({ elevenLabsApiKey: "" })}>
          <Trash2 size={16} />
          Remove ElevenLabs key
        </button>
      </div>
      <div className="button-row compact">
        <button type="button" onClick={exportSettings}>
          Export settings
        </button>
        <button type="button" onClick={() => importInputRef.current?.click()}>
          Import settings
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="visually-hidden"
          onChange={(event) => {
            void importSettings(event.target.files?.[0]).finally(() => {
              event.currentTarget.value = "";
            });
          }}
        />
      </div>
      <p className="privacy-note">
        <EyeOff size={14} />
        PageVoice sends only cleaned text you choose to read. API keys stay in extension storage and are not sent to content scripts.
      </p>
    </section>
  );
}
