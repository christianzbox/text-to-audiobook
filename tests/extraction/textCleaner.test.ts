import { describe, expect, it } from "vitest";
import { cleanText } from "../../src/shared/extraction/textCleaner";

describe("cleanText", () => {
  it("removes repeated UI labels", () => {
    const text = cleanText("upvote\nreply\nThis is the real comment.\nshare\nThis is the real comment.");
    expect(text).toBe("This is the real comment.");
  });

  it("removes repeated mixed-case UI labels without deleting real prose", () => {
    const text = cleanText("Reply\nShare\nAward\nThe author explains why sharing context matters.\nSAVE\nReport");
    expect(text).toBe("The author explains why sharing context matters.");
  });

  it("preserves normal content and punctuation", () => {
    const text = cleanText("  A sentence with commas, timing, and a point.   Another sentence! ");
    expect(text).toContain("A sentence with commas, timing, and a point.");
    expect(text).toContain("Another sentence!");
  });

  it("collapses whitespace", () => {
    expect(cleanText("One    two\t three")).toBe("One two three");
  });

  it("turns giant URLs into readable hostnames", () => {
    expect(cleanText("Read https://www.example.com/some/really/long/path?with=query now.")).toBe("Read example.com now.");
  });

  it("removes duplicate chunks", () => {
    expect(cleanText("Same line.\nSame line.\nDifferent line.")).toBe("Same line.\n\nDifferent line.");
  });

  it("removes GitHub upload error chrome", () => {
    const text = cleanText(`
      This pull request adds audio-reactive rendering controls.
      We don't support that file type.
      Try again with a GIF, JPEG, JPG, MOV, MP4, PNG, SVG, or WEBM.
      Attach files by dragging & dropping, selecting or pasting them.
    `);

    expect(text).toBe("This pull request adds audio-reactive rendering controls.");
  });
});
