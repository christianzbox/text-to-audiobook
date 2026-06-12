import { stableHash } from "../utils/hash";
import { estimateListeningSeconds, estimateWordCount } from "../utils/timing";
import { cleanInlineText, cleanText } from "./textCleaner";
import type { ExtractionResult, ReadableBlock } from "./types";

export function isHackerNewsUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "news.ycombinator.com";
  } catch {
    return false;
  }
}

export function extractHackerNews(document: Document): ExtractionResult {
  const storyTitle = cleanInlineText(document.querySelector(".titleline a")?.textContent ?? document.title);
  const blocks: ReadableBlock[] = [];

  if (storyTitle) {
    blocks.push(makeBlock(`hn-story-${stableHash(storyTitle)}`, `Hacker News discussion: ${storyTitle}.`, document, 0));
  }

  const comments = Array.from(document.querySelectorAll(".athing.comtr, tr.comtr"))
    .map((row) => {
      const text = cleanText(row.querySelector(".commtext")?.textContent ?? "");
      if (estimateWordCount(text) < 3) {
        return null;
      }
      const indent = row.querySelector(".ind img")?.getAttribute("width");
      const depth = indent ? Math.floor(Number(indent) / 40) : 0;
      return makeBlock(`hn-comment-${stableHash(text)}`, `Next comment.\n\n${text}`, document, depth);
    })
    .filter((block): block is ReadableBlock => Boolean(block));

  blocks.push(...comments);
  return {
    title: storyTitle || document.title || "Hacker News",
    url: document.location?.href ?? "",
    blocks,
    fullText: cleanText(blocks.map((block) => block.text).join("\n\n")),
    extractorName: "hacker-news",
    warnings: blocks.length ? [] : ["No readable Hacker News comments found."]
  };
}

function makeBlock(id: string, text: string, document: Document, depth: number): ReadableBlock {
  return {
    id,
    text,
    sourceUrl: document.location?.href ?? "",
    pageTitle: document.title || "Hacker News",
    blockType: "forum_post",
    estimatedWords: estimateWordCount(text),
    estimatedSeconds: estimateListeningSeconds(text),
    metadata: { depth }
  };
}
