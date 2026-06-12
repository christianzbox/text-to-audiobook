import { useCallback, useEffect, useState } from "react";
import { browserApi } from "../shared/browser/browserApi";
import { DEFAULT_SETTINGS } from "../shared/settings/defaults";
import type { PageVoiceSettings } from "../shared/settings/schema";
import { SettingsPanel } from "../sidepanel/components/SettingsPanel";

export default function OptionsApp() {
  const [settings, setSettings] = useState<PageVoiceSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void browserApi.runtime
      .sendMessage<PageVoiceSettings>({ type: "SETTINGS_GET", includeSecrets: true })
      .then(setSettings);
  }, []);

  const updateSettings = useCallback(async (patch: Partial<PageVoiceSettings>) => {
    const next = await browserApi.runtime.sendMessage<PageVoiceSettings>({ type: "SETTINGS_UPDATE", patch });
    setSettings(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }, []);

  return (
    <main className="app-shell options-shell">
      <header className="app-header">
        <div className="brand-copy">
          <strong>PageVoice Options</strong>
          <span>Provider keys and privacy-sensitive settings</span>
        </div>
      </header>
      <SettingsPanel settings={settings} onChange={(patch) => void updateSettings(patch)} />
      {saved ? <div className="status-pill">Saved</div> : null}
    </main>
  );
}
