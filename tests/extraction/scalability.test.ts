import { describe, expect, it } from "vitest";
import { chunkText } from "../../src/shared/extraction/chunker";
import { extractGenericDom, getReadableElementCandidates } from "../../src/shared/extraction/genericDomExtractor";

describe("scalable extraction and chunking behavior", () => {
  it("keeps large readable documents ordered while rejecting link-heavy chrome", () => {
    const paragraphs = Array.from({ length: 80 }, (_, index) =>
      `<p>Section ${index + 1} explains the PageVoice extraction pipeline with enough prose to score as readable content. It keeps narration focused and avoids interface text.</p>`
    ).join("");
    const nav = Array.from({ length: 80 }, (_, index) => `<a href="/nav-${index}">Navigation ${index}</a>`).join("");

    document.body.innerHTML = `
      <nav>${nav}</nav>
      <main>
        <article>${paragraphs}</article>
      </main>
    `;

    const result = extractGenericDom(document);
    expect(result.fullText).toContain("Section 1 explains");
    expect(result.fullText).toContain("narration focused");
    expect(result.fullText).not.toContain("Navigation 79");

    const candidates = getReadableElementCandidates(document);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].block.text).toContain("PageVoice extraction pipeline");
  });

  it("chunks long generated queues without losing order or exceeding practical bounds", () => {
    const text = Array.from({ length: 240 }, (_, index) =>
      `Paragraph ${index + 1}. This sentence is intentionally regular so queue chunking can preserve order across a long page.`
    ).join("\n\n");

    const chunks = chunkText(text, { maxChars: 900 });
    expect(chunks.length).toBeGreaterThan(10);
    expect(chunks.every((chunk) => chunk.text.length <= 930)).toBe(true);
    expect(chunks[0].text).toContain("Paragraph 1.");
    expect(chunks.at(-1)?.text).toContain("Paragraph 240.");
    expect(chunks.map((chunk) => chunk.index)).toEqual(chunks.map((_, index) => index));
  });
});
