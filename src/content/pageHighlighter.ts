import { formatDuration } from "../shared/utils/timing";
import type { ReadableBlock } from "../shared/extraction/types";

export class PageHighlighter {
  private readonly outline: HTMLDivElement;
  private readonly label: HTMLDivElement;

  constructor(private readonly document: Document) {
    this.outline = document.createElement("div");
    this.label = document.createElement("div");
    this.outline.dataset.pagevoicePicker = "outline";
    this.label.dataset.pagevoicePicker = "label";
    this.applyStyles();
    document.documentElement.append(this.outline, this.label);
  }

  show(element: Element, block: ReadableBlock, action: "read" | "queue" = "read"): void {
    const rect = element.getBoundingClientRect();
    this.outline.style.opacity = "1";
    this.outline.style.transform = `translate(${Math.max(0, rect.left + window.scrollX)}px, ${Math.max(
      0,
      rect.top + window.scrollY
    )}px)`;
    this.outline.style.width = `${Math.max(24, rect.width)}px`;
    this.outline.style.height = `${Math.max(24, rect.height)}px`;

    const labelTop = Math.max(8, rect.top + window.scrollY - 42);
    const labelLeft = Math.max(8, rect.left + window.scrollX);
    this.label.textContent = `${action === "queue" ? "Add to queue" : labelForType(block.blockType)} · ${
      block.estimatedWords
    } words · ${formatDuration(
      block.estimatedSeconds
    )} · Shift-click queues`;
    this.label.style.opacity = "1";
    this.label.style.transform = `translate(${labelLeft}px, ${labelTop}px)`;
  }

  hide(): void {
    this.outline.style.opacity = "0";
    this.label.style.opacity = "0";
  }

  destroy(): void {
    this.outline.remove();
    this.label.remove();
  }

  private applyStyles(): void {
    Object.assign(this.outline.style, {
      position: "absolute",
      zIndex: "2147483646",
      pointerEvents: "none",
      boxSizing: "border-box",
      border: "2px solid rgba(32, 201, 151, 0.95)",
      background: "rgba(32, 201, 151, 0.12)",
      borderRadius: "8px",
      boxShadow: "0 16px 48px rgba(16, 24, 40, 0.22), inset 0 0 0 1px rgba(255,255,255,0.45)",
      opacity: "0",
      transition: "opacity 120ms ease, transform 80ms ease, width 80ms ease, height 80ms ease"
    });

    Object.assign(this.label.style, {
      position: "absolute",
      zIndex: "2147483647",
      pointerEvents: "none",
      boxSizing: "border-box",
      padding: "8px 10px",
      color: "#f8fafc",
      background: "rgba(16, 24, 40, 0.92)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: "8px",
      boxShadow: "0 12px 32px rgba(16, 24, 40, 0.28)",
      font: "500 12px/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      opacity: "0",
      transition: "opacity 120ms ease, transform 80ms ease"
    });
  }
}

function labelForType(type: ReadableBlock["blockType"]): string {
  switch (type) {
    case "reddit_post":
      return "Read post";
    case "reddit_comment":
      return "Read comment";
    case "reddit_thread":
      return "Read thread";
    case "heading":
      return "Read section";
    case "code":
      return "Read code";
    default:
      return "Read this";
  }
}
