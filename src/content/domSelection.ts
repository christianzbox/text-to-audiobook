import { stableHash } from "../shared/utils/hash";
import { estimateListeningSeconds, estimateWordCount } from "../shared/utils/timing";
import { cleanText } from "../shared/extraction/textCleaner";
import type { ExtractionResult, ReadableBlock } from "../shared/extraction/types";

export function extractSelectedText(document: Document): ExtractionResult {
  const selection = document.defaultView?.getSelection();
  const text = cleanText(selection?.toString() ?? "");
  const block = text ? makeSelectionBlock(text, document) : null;
  return {
    title: document.title || "Selected text",
    url: document.location.href,
    blocks: block ? [block] : [],
    fullText: text,
    extractorName: "selection",
    warnings: block ? [] : ["No selected text found on this page."]
  };
}

function makeSelectionBlock(text: string, document: Document): ReadableBlock {
  return {
    id: `selection-${stableHash(text)}`,
    text,
    sourceUrl: document.location.href,
    pageTitle: document.title || "Selected text",
    blockType: "paragraph",
    estimatedWords: estimateWordCount(text),
    estimatedSeconds: estimateListeningSeconds(text)
  };
}
