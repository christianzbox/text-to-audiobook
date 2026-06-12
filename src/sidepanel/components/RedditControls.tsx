import type { PageVoiceSettings, RedditMode } from "../../shared/settings/schema";

interface RedditControlsProps {
  settings: PageVoiceSettings;
  onChange: (patch: Partial<PageVoiceSettings>) => void;
}

const MODES: Array<{ id: RedditMode; label: string }> = [
  { id: "post_only", label: "Original post" },
  { id: "post_top_comments", label: "Post + top comments" },
  { id: "selected_comment", label: "Selected comment" },
  { id: "selected_thread", label: "Selected thread" },
  { id: "top_comments", label: "Top comments" }
];

export function RedditControls({ settings, onChange }: RedditControlsProps) {
  return (
    <section className="panel-section">
      <div className="section-title">Reddit</div>
      <div className="field-grid">
        <label>
          <span>Mode</span>
          <select value={settings.redditMode} onChange={(event) => onChange({ redditMode: event.target.value as RedditMode })}>
            {MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Comments</span>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.redditCommentLimit}
            onChange={(event) => onChange({ redditCommentLimit: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="toggle-grid">
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settings.skipAutoModerator}
            onChange={(event) => onChange({ skipAutoModerator: event.target.checked })}
          />
          <span>Skip AutoModerator</span>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settings.skipDeletedRemoved}
            onChange={(event) => onChange({ skipDeletedRemoved: event.target.checked })}
          />
          <span>Skip deleted/removed</span>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settings.readUsernames}
            onChange={(event) => onChange({ readUsernames: event.target.checked })}
          />
          <span>Read usernames</span>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settings.readScores}
            onChange={(event) => onChange({ readScores: event.target.checked })}
          />
          <span>Read scores</span>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={settings.readTimestamps}
            onChange={(event) => onChange({ readTimestamps: event.target.checked })}
          />
          <span>Read timestamps</span>
        </label>
      </div>
    </section>
  );
}
