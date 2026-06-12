import { describe, expect, it } from "vitest";
import { chunkText } from "../../src/shared/extraction/chunker";

describe("chunkText", () => {
  it("respects max chunk size", () => {
    const chunks = chunkText("A short sentence. ".repeat(120), { maxChars: 160 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.text.length <= 180)).toBe(true);
  });

  it("preserves sentence boundaries", () => {
    const chunks = chunkText("First sentence. Second sentence. Third sentence.", { maxChars: 25 });
    expect(chunks[0].text.endsWith(".")).toBe(true);
  });

  it("preserves paragraph order", () => {
    const chunks = chunkText("Paragraph one.\n\nParagraph two.\n\nParagraph three.", { maxChars: 40 });
    expect(chunks.map((chunk) => chunk.text).join("\n\n")).toContain("Paragraph one");
    expect(chunks.map((chunk) => chunk.text).join("\n\n")).toContain("Paragraph three");
  });

  it("handles long paragraphs", () => {
    const chunks = chunkText("word ".repeat(700), { maxChars: 300 });
    expect(chunks.length).toBeGreaterThan(5);
  });

  it("returns no chunks for blank text", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("does not split sentence boundaries inside URLs", () => {
    const chunks = chunkText("Read https://example.com/a.long.path/value for context. Then continue with the next sentence.", {
      maxChars: 70
    });
    expect(chunks[0].text).toContain("https://example.com/a.long.path/value");
  });

  it("keeps common abbreviations with their sentence", () => {
    const chunks = chunkText("Dr. Rivera explained the result carefully. The next paragraph can stand alone.", {
      maxChars: 45
    });
    expect(chunks[0].text).toContain("Dr. Rivera explained");
  });
});
