import { stableHash } from "../utils/hash";
import { estimateListeningSeconds, estimateWordCount } from "../utils/timing";
import { cleanInlineText, cleanText } from "./textCleaner";
import type { ExtractionResult, ReadableBlock, RedditExtractionOptions } from "./types";

const DEFAULT_OPTIONS: RedditExtractionOptions = {
  mode: "post_top_comments",
  commentLimit: 8,
  readUsernames: false,
  readScores: false,
  readTimestamps: false,
  skipAutoModerator: true,
  skipDeletedRemoved: true
};

export function isRedditUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "reddit.com" || host === "old.reddit.com" || host === "new.reddit.com";
  } catch {
    return false;
  }
}

export function extractReddit(document: Document, options: Partial<RedditExtractionOptions> = {}): ExtractionResult {
  const resolved = { ...DEFAULT_OPTIONS, ...options };
  const title = findPostTitle(document);
  const postBody = findPostBody(document);
  const postText = cleanText([title ? `Reddit post: ${title}.` : "Reddit post.", postBody].filter(Boolean).join("\n\n"));
  const blocks: ReadableBlock[] = [];

  if (postText && !["top_comments", "selected_comment", "selected_thread"].includes(resolved.mode)) {
    blocks.push(makeBlock("reddit-post", postText, document, "reddit_post", { title }));
  }

  if (resolved.mode !== "post_only") {
    const commentCandidates = findCommentElements(document)
      .map((element) => commentFromElement(element, document, resolved))
      .filter((candidate): candidate is RedditCommentCandidate => Boolean(candidate));
    const selectedComment = findSelectedCommentElement(document);
    const comments = selectCommentsForMode(commentCandidates, selectedComment, resolved);

    if (comments.length && ["post_top_comments", "top_comments"].includes(resolved.mode)) {
      blocks.push(makeBlock("reddit-top-comments", "Top comments.", document, "reddit_thread"));
    }
    blocks.push(...comments.map((candidate, index) => withCommentTransition(candidate.block, index, resolved)));
  }

  const fullText = cleanText(blocks.map((block) => block.text).join("\n\n"));
  return {
    title: title || document.title || "Reddit",
    url: document.location?.href ?? "",
    blocks,
    fullText,
    extractorName: "reddit",
    warnings: blocks.length ? [] : ["No readable Reddit content found."]
  };
}

function findPostTitle(document: Document): string {
  const selectors = [
    "shreddit-post h1[slot='title']",
    "shreddit-post [slot='title']",
    "shreddit-title",
    "[data-testid='post-title'] h1",
    "h1",
    "[data-testid='post-title']",
    ".link .title a.title",
    "a.title"
  ];
  for (const selector of selectors) {
    const text = cleanInlineText(document.querySelector(selector)?.textContent ?? "");
    if (text) {
      return text;
    }
  }
  return cleanInlineText(document.title.replace(/ : .+$/, ""));
}

function findPostBody(document: Document): string {
  const selectors = [
    "shreddit-post [slot='text-body']",
    "shreddit-post [data-post-click-location='text-body']",
    "shreddit-post div[id$='post-rtjson-content']",
    "[data-testid='post-selftext']",
    "[data-post-click-location='text-body']",
    "[data-testid='post-content']",
    ".link .usertext-body .md",
    ".expando .usertext-body .md",
    ".usertext-body .md",
    ".usertext-body",
    ".Post [data-click-id='text']"
  ];
  for (const selector of selectors) {
    const text = cleanText(document.querySelector(selector)?.textContent ?? "");
    if (estimateWordCount(text) >= 4) {
      return text;
    }
  }
  return "";
}

function findCommentElements(document: Document): Element[] {
  const selectors = [
    "shreddit-comment",
    "comment-tree shreddit-comment",
    "[id^='t1_'][data-testid='comment']",
    "[data-testid='comment']",
    "[data-comment-id]",
    "div[id^='t1_']",
    "[data-testid='comment']",
    ".Comment",
    ".comment",
    ".thing.comment"
  ];
  const seen = new Set<Element>();
  const result: Element[] = [];
  for (const selector of selectors) {
    for (const element of Array.from(document.querySelectorAll(selector))) {
      if (!seen.has(element)) {
        seen.add(element);
        result.push(element);
      }
    }
  }
  return result;
}

interface RedditCommentCandidate {
  element: Element;
  block: ReadableBlock;
  depth: number;
}

function commentFromElement(
  element: Element,
  document: Document,
  options: RedditExtractionOptions
): RedditCommentCandidate | null {
  const author = cleanInlineText(
    element.getAttribute("author")
      ?? element.getAttribute("data-author")
      ?? element.querySelector("[slot='commentMeta'] a, [slot='commentMeta'] span, .author, [data-testid='comment_author_link'], a[href*='/user/'], a[href*='/u/']")?.textContent
      ?? ""
  );
  if (options.skipAutoModerator && /automoderator/i.test(author)) {
    return null;
  }

  const raw = findCommentText(element);
  const body = cleanText(raw);
  if (!body || estimateWordCount(body) < 3) {
    return null;
  }
  if (options.skipDeletedRemoved && /^\[(deleted|removed)\]$/i.test(body)) {
    return null;
  }

  const prefixParts: string[] = [];
  if (options.readUsernames && author) {
    prefixParts.push(`${author} says:`);
  }
  if (options.readScores) {
    const score = cleanInlineText(
      element.querySelector("[id*='vote-arrows'], .score, [data-testid='vote-arrows'], faceplate-number, [aria-label*='upvote']")?.textContent
        ?? ""
    );
    if (score) {
      prefixParts.push(`Score: ${score}.`);
    }
  }
  if (options.readTimestamps) {
    const timestamp = cleanInlineText(element.querySelector("time, .live-timestamp")?.textContent ?? "");
    if (timestamp) {
      prefixParts.push(timestamp);
    }
  }

  const depth = inferCommentDepth(element);
  const text = cleanText(`${prefixParts.join(" ")}\n\n${body}`);
  const block = makeBlock(`reddit-comment-${stableHash(text)}`, text, document, "reddit_comment", {
    author,
    depth,
    elementPath: getCommentKey(element)
  });
  return { element, block, depth };
}

function findCommentText(element: Element): string {
  const selectors = [
    "[slot='comment']",
    "[slot='comment'] p",
    "[data-testid='comment'] [id$='comment-rtjson-content']",
    "[id$='comment-rtjson-content']",
    "[data-testid='comment'] p",
    ".md",
    ".md p",
    ".usertext-body",
    ".comment-body",
    "p"
  ];
  for (const selector of selectors) {
    const nodes = Array.from(element.querySelectorAll(selector));
    const text = cleanText(nodes.map((node) => extractNodeTextPreservingQuotes(node)).join("\n\n"));
    if (estimateWordCount(text) >= 3) {
      return text;
    }
  }
  return extractNodeTextPreservingQuotes(element);
}

function extractNodeTextPreservingQuotes(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  for (const hidden of Array.from(clone.querySelectorAll("button, menu, nav, footer, [aria-hidden='true'], [hidden]"))) {
    hidden.remove();
  }
  for (const quote of Array.from(clone.querySelectorAll("blockquote"))) {
    const quoteText = cleanText(quote.textContent ?? "", { preserveParagraphs: false });
    quote.textContent = quoteText ? `Quoted: ${quoteText}` : "";
  }
  return clone.textContent ?? "";
}

function selectCommentsForMode(
  candidates: RedditCommentCandidate[],
  selectedElement: Element | null,
  options: RedditExtractionOptions
): RedditCommentCandidate[] {
  if (!["selected_comment", "selected_thread"].includes(options.mode)) {
    return candidates.slice(0, options.commentLimit);
  }

  const selectedIndex = selectedElement
    ? candidates.findIndex((candidate) => candidate.element === selectedElement || candidate.element.contains(selectedElement))
    : -1;
  if (selectedIndex < 0) {
    return candidates.slice(0, Math.min(1, options.commentLimit));
  }

  const selected = candidates[selectedIndex];
  if (options.mode === "selected_comment") {
    return [selected];
  }

  const subtree = [selected];
  for (let index = selectedIndex + 1; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (candidate.depth <= selected.depth) {
      break;
    }
    subtree.push(candidate);
    if (subtree.length >= options.commentLimit) {
      break;
    }
  }
  return subtree;
}

function findSelectedCommentElement(document: Document): Element | null {
  const selection = document.defaultView?.getSelection();
  const anchor = selection?.anchorNode;
  const element = anchor instanceof Element ? anchor : anchor?.parentElement;
  return element?.closest("shreddit-comment, [data-testid='comment'], [data-comment-id], div[id^='t1_'], .comment, .Comment") ?? null;
}

function withCommentTransition(block: ReadableBlock, index: number, options: RedditExtractionOptions): ReadableBlock {
  if (index === 0 || block.text.startsWith("Next comment.") || options.readUsernames) {
    return block;
  }
  const text = cleanText(`Next comment.\n\n${block.text}`);
  return {
    ...block,
    text,
    estimatedWords: estimateWordCount(text),
    estimatedSeconds: estimateListeningSeconds(text)
  };
}

function inferCommentDepth(element: Element): number {
  const explicit = Number(element.getAttribute("depth") ?? element.getAttribute("data-depth") ?? element.getAttribute("aria-level") ?? "");
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  const oldRedditIndent = element.querySelector(".child") ? 1 : 0;
  const margin = element.getAttribute("style")?.match(/margin-left:\s*(\d+)px/i)?.[1];
  if (margin) {
    return Math.floor(Number(margin) / 24);
  }
  return oldRedditIndent;
}

function getCommentKey(element: Element): string {
  return (
    element.getAttribute("thingid")
    ?? element.getAttribute("data-fullname")
    ?? element.getAttribute("data-comment-id")
    ?? element.id
    ?? stableHash((element.textContent ?? "").slice(0, 160))
  );
}

function makeBlock(
  id: string,
  text: string,
  document: Document,
  blockType: ReadableBlock["blockType"],
  metadata: ReadableBlock["metadata"] = {}
): ReadableBlock {
  return {
    id,
    text,
    sourceUrl: document.location?.href ?? "",
    pageTitle: document.title || "Reddit",
    blockType,
    estimatedWords: estimateWordCount(text),
    estimatedSeconds: estimateListeningSeconds(text),
    metadata
  };
}
