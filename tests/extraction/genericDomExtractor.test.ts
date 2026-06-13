import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractGenericDom } from "../../src/shared/extraction/genericDomExtractor";

function loadFixture(name: string): Document {
  return new DOMParser().parseFromString(readFileSync(resolve("tests/fixtures", name), "utf8"), "text/html");
}

describe("extractGenericDom", () => {
  it("extracts article text from fixture", () => {
    const result = extractGenericDom(loadFixture("article-basic.html"));
    expect(result.fullText).toContain("The best tools disappear");
    expect(result.fullText).toContain("recognizes the page");
  });

  it("ignores nav, footer, and buttons", () => {
    const result = extractGenericDom(loadFixture("article-basic.html"));
    expect(result.fullText).not.toContain("Subscribe");
    expect(result.fullText).not.toContain("Terms");
  });

  it("prefers main or article content", () => {
    const result = extractGenericDom(loadFixture("article-basic.html"));
    expect(result.blocks[0].blockType).toBe("article");
  });

  it("avoids repeated links", () => {
    const fixture = new DOMParser().parseFromString(`
      <main><article><p>This is a meaningful paragraph with enough words to pass extraction and sound natural.</p></article></main>
      <nav><a>One</a><a>Two</a><a>Three</a><a>Four</a><a>Five</a></nav>
    `, "text/html");
    const result = extractGenericDom(fixture);
    expect(result.fullText).toContain("meaningful paragraph");
    expect(result.fullText).not.toContain("One Two Three");
  });

  it("does not narrate hidden GitHub upload controls", () => {
    const result = extractGenericDom(loadFixture("github-pr.html"));
    expect(result.fullText).toContain("audio-reactive controls");
    expect(result.fullText).not.toContain("We don't support that file type");
    expect(result.fullText).not.toContain("Try again with a GIF");
    expect(result.fullText).not.toContain("Attach files by dragging");
  });
});
