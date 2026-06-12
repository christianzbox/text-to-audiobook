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

  return (
    <section className="panel-section playback-section">
      <div className="section-title">Playback</div>
      <div className="button-row">
        <button type="button" className="primary-button" disabled={!canPlay} onClick={onPlay}>
          <Play size={16} />
          Play
        </button>
        <button type="button" disabled={!canPlay} onClick={onPauseResume}>
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button type="button" disabled={!canPlay} onClick={onStop}>
          <Square size={16} />
          Stop
        </button>
        <button type="button" disabled={!canPlay} onClick={onNext}>
          <SkipForward size={16} />
          Next
        </button>
        <button type="button" disabled={!canPlay} onClick={onClear}>
          <Trash2 size={16} />
          Clear
        </button>
      </div>
    </section>
  );
}
