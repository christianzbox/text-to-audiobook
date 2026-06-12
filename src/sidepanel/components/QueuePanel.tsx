import type { Chunk } from "../../shared/extraction/types";
import { formatDuration } from "../../shared/utils/timing";

interface QueuePanelProps {
  chunks: Chunk[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function QueuePanel({ chunks, currentIndex, onSelect }: QueuePanelProps) {
  return (
    <section className="panel-section">
      <div className="section-title">Queue</div>
      {chunks.length === 0 ? (
        <div className="empty-state">No chunks queued.</div>
      ) : (
        <div className="queue-list">
          {chunks.map((chunk) => (
            <button
              type="button"
              className={chunk.index === currentIndex ? "queue-item active" : "queue-item"}
              key={chunk.id}
              onClick={() => onSelect(chunk.index)}
            >
              <span>{chunk.index === currentIndex ? "Current chunk" : `Chunk ${chunk.index + 1}`}</span>
              <small>
                {chunk.estimatedWords} words · {formatDuration(chunk.estimatedSeconds)}
              </small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
