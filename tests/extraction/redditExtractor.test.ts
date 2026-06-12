import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractReddit } from "../../src/shared/extraction/redditExtractor";

function loadFixture(name: string): Document {
  return new DOMParser().parseFromString(readFileSync(resolve("tests/fixtures", name), "utf8"), "text/html");
}

describe("extractReddit", () => {
  it("extracts post title and body", () => {
    const result = extractReddit(loadFixture("reddit-post.html"));
    expect(result.fullText).toContain("What tiny software feature changed your day?");
    expect(result.fullText).toContain("keyboard shortcuts");
  });

  it("extracts comments", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"));
    expect(result.fullText).toContain("remembering the last filter");
  });

  it("skips usernames by default", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"));
    expect(result.fullText).not.toContain("useful_person says");
  });

  it("includes usernames when enabled", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"), { readUsernames: true });
    expect(result.fullText).toContain("useful_person says");
  });

  it("skips deleted and removed comments by default", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"));
    expect(result.fullText).not.toContain("[deleted]");
  });

  it("skips AutoModerator when enabled", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"), { skipAutoModerator: true });
    expect(result.fullText).not.toContain("subreddit rules");
  });

  it("preserves visible comment order", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"));
    expect(result.fullText.indexOf("remembering the last filter")).toBeLessThan(
      result.fullText.indexOf("nested comment should still keep")
    );
  });

  it("handles nested comments reasonably", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"));
    const nested = result.blocks.find((block) => block.metadata?.depth === 1 && block.text.includes("nested comment"));
    expect(nested).toBeTruthy();
  });

  it("preserves quoted text naturally", () => {
    const result = extractReddit(loadFixture("reddit-thread.html"));
    expect(result.fullText).toContain("Quoted: Parent comment quoted text.");
  });

  it("extracts old Reddit posts and comments", () => {
    const result = extractReddit(loadFixture("reddit-old.html"));
    expect(result.fullText).toContain("Old Reddit still has readable posts");
    expect(result.fullText).toContain("Old Reddit comments should be read");
    expect(result.fullText).not.toContain("permalink");
  });

  it("can read the selected comment only", () => {
    document.documentElement.innerHTML = readFileSync(resolve("tests/fixtures", "reddit-thread.html"), "utf8");
    const selectedParagraph = document.querySelector("shreddit-comment p");
    const range = document.createRange();
    range.selectNodeContents(selectedParagraph as Node);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const result = extractReddit(document, { mode: "selected_comment" });
    expect(result.fullText).toContain("remembering the last filter");
    expect(result.fullText).not.toContain("nested comment should still keep");
  });

  it("can read the selected comment subtree", () => {
    document.documentElement.innerHTML = readFileSync(resolve("tests/fixtures", "reddit-thread.html"), "utf8");
    const selectedParagraph = document.querySelector("shreddit-comment p");
    const range = document.createRange();
    range.selectNodeContents(selectedParagraph as Node);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const result = extractReddit(document, { mode: "selected_thread", commentLimit: 10 });
    expect(result.fullText).toContain("remembering the last filter");
    expect(result.fullText).toContain("nested comment should still keep");
    expect(result.fullText).not.toContain("second top-level comment");
  });
});
