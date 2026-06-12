import { Headphones, RefreshCw } from "lucide-react";
import type { PageInfo } from "../../shared/messages/types";
import type { TTSProviderId } from "../../shared/settings/schema";

interface HeaderProps {
  pageInfo: PageInfo | null;
  provider: TTSProviderId;
  onRefresh: () => void;
}

export function Header({ pageInfo, provider, onRefresh }: HeaderProps) {
  const indicator = provider === "browser-speech" || provider === "local-kokoro" ? "Local/browser voice" : "Cloud AI voice";

  return (
    <header className="app-header">
      <div className="brand-row">
        <div className="brand-mark" aria-hidden="true">
          <Headphones size={20} />
        </div>
        <div className="brand-copy">
          <strong>PageVoice</strong>
          <span>{indicator}</span>
        </div>
        <button className="icon-button" type="button" title="Refresh page info" onClick={onRefresh}>
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="page-meta">
        <div className="page-title">{pageInfo?.title || "No active page"}</div>
        <div className="page-url">{pageInfo?.url || "Open a normal webpage to begin."}</div>
      </div>
    </header>
  );
}
