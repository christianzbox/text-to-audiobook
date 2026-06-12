import { Readability } from "@mozilla/readability";
import { stableHash } from "../utils/hash";
import { estimateListeningSeconds, estimateWordCount } from "../utils/timing";
import { cleanText } from "./textCleaner";
import type { ExtractionResult } from "./types";

export function extractWithReadability(document: Document): ExtractionResult | null {
  const clone = document.cloneNode(true) as Document;
  const article = new Readability(clone).parse();
  const text = cleanText(article?.textContent ?? "");
  if (!article || estimateWordCount(text) < 40) {
    return null;
  }

  return {
    title: article.title || document.title || "Untitled page",
    url: document.location?.href ?? "",
    fullText: text,
    extractorName: "readability",
    warnings: [],
    blocks: [
      {
        id: `readability-${stableHash(text)}`,
        text,
        htmlSnippet: article.content ?? undefined,
        sourceUrl: document.location?.href ?? "",
        pageTitle: article.title || document.title || "Untitled page",
        blockType: "article",
        estimatedWords: estimateWordCount(text),
        estimatedSeconds: estimateListeningSeconds(text)
      }
    ]
  };
}
