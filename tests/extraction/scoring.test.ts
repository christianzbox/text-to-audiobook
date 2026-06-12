import { describe, expect, it } from "vitest";
import { extractGenericDom, getReadableElementCandidates } from "../../src/shared/extraction/genericDomExtractor";
import { scoreReadableElement } from "../../src/shared/extraction/scoring";

describe("picker block scoring", () => {
  it("prefers readable article paragraphs over tiny UI controls", () => {
    document.body.innerHTML = `
      <main>
        <article>
          <p id="content">This paragraph contains enough readable prose to be narrated naturally. It has punctuation, clear sentence boundaries, and no controls.</p>
        </article>
        <div class="toolbar"><button id="tiny">Share</button><button>Save</button></div>
      </main>
    `;

    const paragraph = document.querySelector("#content") as Element;
    const toolbar = document.querySelector(".toolbar") as Element;

    expect(scoreReadableElement(paragraph)).toBeGreaterThan(scoreReadableElement(toolbar));
    expect(getReadableElementCandidates(document)[0].block.text).toContain("readable prose");
  });

  it("rejects link-heavy navigation blocks", () => {
    document.body.innerHTML = `
      <main>
        <nav class="site-menu"><a>Home</a><a>Docs</a><a>API</a><a>Blog</a><a>Pricing</a><a>Login</a></nav>
        <article><p>This documentation section has actual explanation that should be available to the picker.</p></article>
      </main>
    `;

    const result = extractGenericDom(document);
    expect(result.fullText).toContain("actual explanation");
    expect(result.fullText).not.toContain("Home Docs API");
  });
});
