import { stableHash } from "../utils/hash";
import { estimateListeningSeconds, estimateWordCount } from "../utils/timing";
import { cleanText } from "./textCleaner";
import { isLikelyNavigation, scoreReadableElement } from "./scoring";
import type { BlockType, ExtractionContext, ExtractionResult, ReadableBlock } from "./types";

export interface ElementReadableBlock {
  element: Element;
  block: ReadableBlock;
  score: number;
}

const IGNORED_SELECTOR = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "nav",
  "footer",
  "aside",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "video",
  "audio",
  "[aria-hidden='true']",
  "[hidden]",
  "[role='navigation']",
  "[role='menu']",
  "[role='menubar']",
  "[role='dialog']",
  "[role='tooltip']",
  "[data-testid*='tooltip']",
  "[data-testid*='popover']"
].join(",");

const IGNORED_TEXT_HINTS = /(clipboard|copy|dropdown|file-attachment|flash|js-upload|menu|modal|notification|overlay|popover|toast|tooltip|upload)/i;

export function extractGenericDom(document: Document, context = getDocumentContext(document)): ExtractionResult {
  const candidates = getReadableElementCandidates(document, context)
    .slice(0, 30)
    .map((candidate) => candidate.block);
  const blocks = removeNestedDuplicateBlocks(candidates);
  const fullText = cleanText(blocks.map((block) => block.text).join("\n\n"));

  return {
    title: context.title,
    url: context.url,
    blocks,
    fullText,
    extractorName: "generic-dom",
    warnings: blocks.length ? [] : ["No readable blocks found."]
  };
}

export function getReadableElementCandidates(document: Document, context = getDocumentContext(document)): ElementReadableBlock[] {
  const root = document.querySelector("article, main, [role='main']") ?? document.body;
  if (!root) {
    return [];
  }

  const elements = Array.from(
    root.querySelectorAll(
      "article, main, [role='article'], [role='main'], section, div, p, li, blockquote, pre, h1, h2, h3, [data-testid*='post'], [data-testid*='comment']"
    )
  );
  const seen = new Set<string>();
  const candidates: ElementReadableBlock[] = [];

  for (const element of elements) {
    if (!isReadableElement(element)) {
      continue;
    }

    const rawText = extractReadableText(element);
    const text = cleanText(rawText);
    const words = estimateWordCount(text);
    if (words < 8) {
      continue;
    }

    const hash = stableHash(text.toLowerCase());
    if (seen.has(hash)) {
      continue;
    }
    seen.add(hash);

    const score = scoreReadableElement(element);
    if (score < 24) {
      continue;
    }

    candidates.push({
      element,
      score,
      block: {
        id: `generic-${hash}`,
        text,
        htmlSnippet: trimHtml(element.outerHTML),
        sourceUrl: context.url,
        pageTitle: context.title,
        blockType: inferBlockType(element),
        estimatedWords: words,
        estimatedSeconds: estimateListeningSeconds(text),
        metadata: {
          elementPath: elementPath(element)
        }
      }
    });
  }

  return candidates.sort((left, right) => right.score - left.score);
}

function extractReadableText(root: Element): string {
  const ownerDocument = root.ownerDocument;
  const walker = ownerDocument.createTreeWalker(root, 4, {
    acceptNode(node) {
      const text = node.textContent?.trim();
      const parent = node.parentElement;
      if (!text || !parent || shouldIgnoreTextNode(parent, root)) {
        return 2;
      }
      return 1;
    }
  });
  const parts: string[] = [];
  let current = walker.nextNode();
  while (current) {
    const text = current.textContent?.trim();
    if (text) {
      parts.push(text);
    }
    current = walker.nextNode();
  }
  return parts.join("\n");
}

function shouldIgnoreTextNode(parent: Element, root: Element): boolean {
  let current: Element | null = parent;
  while (current && current !== root) {
    if (isIgnoredTextContainer(current)) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function isIgnoredTextContainer(element: Element): boolean {
  if (element.matches(IGNORED_SELECTOR)) {
    return true;
  }
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (style && (style.display === "none" || style.visibility === "hidden" || (style.opacity !== "" && Number(style.opacity) === 0))) {
    return true;
  }
  const hints = [
    element.id,
    element.getAttribute("class"),
    element.getAttribute("role"),
    element.getAttribute("aria-label"),
    element.getAttribute("data-testid")
  ].filter(Boolean).join(" ");
  return IGNORED_TEXT_HINTS.test(hints);
}

export function getDocumentContext(document: Document): ExtractionContext {
  return {
    title: document.title || "Untitled page",
    url: document.location?.href ?? ""
  };
}

function isReadableElement(element: Element): boolean {
  if (element.closest(IGNORED_SELECTOR)) {
    return false;
  }
  if (isLikelyNavigation(element)) {
    return false;
  }
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (
    style
    && (style.display === "none" || style.visibility === "hidden" || (style.opacity !== "" && Number(style.opacity) === 0))
  ) {
    return false;
  }
  const rect = element.getBoundingClientRect?.();
  if (rect && rect.width > 0 && rect.height > 0 && rect.width < 12 && rect.height < 12) {
    return false;
  }
  return true;
}

function inferBlockType(element: Element): BlockType {
  const tag = element.tagName.toLowerCase();
  const classId = `${element.className ?? ""} ${element.id ?? ""}`;
  if (tag === "article" || tag === "main" || element.getAttribute("role") === "article") {
    return "article";
  }
  if (/^h[1-6]$/.test(tag)) {
    return "heading";
  }
  if (tag === "pre" || tag === "code" || /\bcode\b/i.test(classId)) {
    return "code";
  }
  if (/comment|thread/i.test(classId)) {
    return "forum_post";
  }
  if (tag === "p") {
    return "paragraph";
  }
  return "unknown";
}

function trimHtml(html: string): string {
  return html.length > 1200 ? `${html.slice(0, 1200)}...` : html;
}

function removeNestedDuplicateBlocks(blocks: ReadableBlock[]): ReadableBlock[] {
  const result: ReadableBlock[] = [];
  for (const block of blocks) {
    const normalized = normalize(block.text);
    if (result.some((existing) => normalize(existing.text).includes(normalized))) {
      continue;
    }
    result.push(block);
  }
  return result;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\W+/g, " ").trim();
}

function elementPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== current.ownerDocument.body && parts.length < 5) {
    const tag = current.tagName.toLowerCase();
    const id = current.id ? `#${current.id}` : "";
    const className = typeof current.className === "string" && current.className
      ? `.${current.className.split(/\s+/).slice(0, 2).join(".")}`
      : "";
    parts.unshift(`${tag}${id}${className}`);
    current = current.parentElement;
  }
  return parts.join(" > ");
}
