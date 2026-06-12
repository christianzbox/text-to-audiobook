import { browserApi } from "../shared/browser/browserApi";
import { getReadableElementCandidates, type ElementReadableBlock } from "../shared/extraction/genericDomExtractor";
import { extractReddit, isRedditUrl } from "../shared/extraction/redditExtractor";
import type { ReadableBlock } from "../shared/extraction/types";
import { PageHighlighter } from "./pageHighlighter";

export class PickerOverlay {
  private candidates: ElementReadableBlock[] = [];
  private highlighter: PageHighlighter | null = null;
  private activeCandidate: ElementReadableBlock | null = null;
  private isActive = false;

  constructor(private readonly document: Document) {}

  start(): void {
    if (this.isActive) {
      return;
    }
    this.isActive = true;
    this.candidates = this.getCandidates();
    this.highlighter = new PageHighlighter(this.document);
    this.document.addEventListener("mousemove", this.handleMouseMove, true);
    this.document.addEventListener("mousedown", this.preventPointerActivation, true);
    this.document.addEventListener("mouseup", this.preventPointerActivation, true);
    this.document.addEventListener("click", this.handleClick, true);
    this.document.addEventListener("keydown", this.handleKeyDown, true);
    this.document.defaultView?.addEventListener("keydown", this.handleKeyDown, true);
    this.document.documentElement.style.cursor = "copy";
  }

  cancel(): void {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;
    this.document.removeEventListener("mousemove", this.handleMouseMove, true);
    this.document.removeEventListener("mousedown", this.preventPointerActivation, true);
    this.document.removeEventListener("mouseup", this.preventPointerActivation, true);
    this.document.removeEventListener("click", this.handleClick, true);
    this.document.removeEventListener("keydown", this.handleKeyDown, true);
    this.document.defaultView?.removeEventListener("keydown", this.handleKeyDown, true);
    this.highlighter?.destroy();
    this.highlighter = null;
    this.activeCandidate = null;
    this.document.documentElement.style.cursor = "";
  }

  private getCandidates(): ElementReadableBlock[] {
    if (isRedditUrl(this.document.location.href)) {
      const result = extractReddit(this.document);
      return result.blocks.map((block) => {
        const element = findElementForRedditBlock(this.document, block) ?? this.document.body;
        return { block, element, score: 100 };
      });
    }
    return getReadableElementCandidates(this.document).slice(0, 120);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const target = this.document.elementFromPoint(event.clientX, event.clientY);
    const candidate = target ? findCandidate(target, this.candidates) : null;
    if (!candidate) {
      this.highlighter?.hide();
      this.activeCandidate = null;
      return;
    }
    this.activeCandidate = candidate;
    this.highlighter?.show(candidate.element, candidate.block, event.shiftKey ? "queue" : "read");
  };

  private handleClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!this.activeCandidate) {
      return;
    }
    const block = this.activeCandidate.block;
    const action = event.shiftKey ? "queue" : "read";
    this.cancel();
    void browserApi.runtime.sendMessage({ type: "PICKER_SELECTED_BLOCK", block, action });
  };

  private preventPointerActivation = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.cancel();
  };
}

function findCandidate(target: Element, candidates: ElementReadableBlock[]): ElementReadableBlock | null {
  let current: Element | null = target;
  while (current) {
    const candidate = candidates.find((entry) => entry.element === current);
    if (candidate) {
      return candidate;
    }
    current = current.parentElement;
  }
  return null;
}

function findElementForRedditBlock(document: Document, block: ReadableBlock): Element | null {
  if (block.blockType === "reddit_post") {
    return document.querySelector("shreddit-post, [data-testid='post-content'], .linklisting .thing.link, .Post");
  }
  if (block.blockType === "reddit_comment") {
    const comments = Array.from(document.querySelectorAll("shreddit-comment, [data-testid='comment'], .comment, .Comment"));
    return comments.find((element) => block.text.includes((element.textContent ?? "").trim().slice(0, 30))) ?? comments[0] ?? null;
  }
  return document.body;
}
