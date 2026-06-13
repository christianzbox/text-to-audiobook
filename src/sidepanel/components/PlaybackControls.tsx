import { Pause, Play, SkipForward, Square, Trash2 } from "lucide-react";
import type { AudioStatus } from "../../shared/messages/types";

interface PlaybackControlsProps {
  status: AudioStatus;
  canPlay: boolean;
  onPlay: () => void;
  onPauseResume: () => void;
  onStop: () => void;
  onNext: () => void;
  onClear: () => void;
}

export function PlaybackControls({
  status,
  canPlay,
  onPlay,
  onPauseResume,
  onStop,
  onNext,
  onClear
}: PlaybackControlsProps) {
  const isPaused = status === "paused";
  const pauseLabel = isPaused ? "Resume" : "Pause";

  return (
    <section className="panel-section playback-section" aria-label="Playback controls">
      <div className="playback-grid">
        <button type="button" className="primary-button playback-play-button" disabled={!canPlay} onClick={onPlay}>
          <Play size={16} />
          Play
        </button>
        <button type="button" className="playback-icon-button" disabled={!canPlay} onClick={onPauseResume} aria-label={pauseLabel} title={pauseLabel}>
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button type="button" className="playback-icon-button" disabled={!canPlay} onClick={onStop} aria-label="Stop" title="Stop">
          <Square size={16} />
        </button>
        <button type="button" className="playback-icon-button" disabled={!canPlay} onClick={onNext} aria-label="Next chunk" title="Next chunk">
          <SkipForward size={16} />
        </button>
        <button type="button" className="playback-icon-button" disabled={!canPlay} onClick={onClear} aria-label="Clear queue" title="Clear queue">
          <Trash2 size={16} />
        </button>
      </div>
    </section>
  );
}
