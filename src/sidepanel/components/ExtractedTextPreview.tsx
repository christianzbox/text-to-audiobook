import { FileText, ListPlus, Volume2 } from "lucide-react";
import { formatDuration } from "../../shared/utils/timing";

interface ExtractedTextPreviewProps {
  text: string;
  wordCount: number;
  seconds: number;
  onChange: (text: string) => void;
  onRead: () => void;
  onQueue: () => void;
}

export function ExtractedTextPreview({ text, wordCount, seconds, onChange, onRead, onQueue }: ExtractedTextPreviewProps) {
  return (
    <section className="panel-section preview-section">
      <div className="section-title with-icon">
        <FileText size={16} />
        Text
      </div>
      <textarea
        className="preview-textarea"
        value={text}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Extracted text appears here."
      />
      <div className="preview-footer">
        <span>
          {wordCount} words · {formatDuration(seconds)}
        </span>
        <div className="button-row compact">
          <button type="button" disabled={!text.trim()} onClick={onQueue}>
            <ListPlus size={16} />
            Queue
          </button>
          <button type="button" className="primary-button" disabled={!text.trim()} onClick={onRead}>
            <Volume2 size={16} />
            Read
          </button>
        </div>
      </div>
    </section>
  );
}
