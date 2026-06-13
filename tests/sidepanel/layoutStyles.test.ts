import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/sidepanel/styles.css"), "utf8");

function cssRule(selectorPattern: string): string {
  const match = new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, "m").exec(styles);
  return match?.[1] ?? "";
}

describe("side panel layout styles", () => {
  it("keeps the extension viewport stable and scrolls inside the app shell", () => {
    const rootRule = cssRule("html,\\s*body,\\s*#root");
    const bodyRule = cssRule("body");
    const shellRule = cssRule("\\.app-shell");

    expect(rootRule).toContain("height: 100%");
    expect(rootRule).toContain("overflow: hidden");
    expect(bodyRule).not.toContain("overflow-y: auto");
    expect(shellRule).toContain("height: 100vh");
    expect(shellRule).toContain("height: 100dvh");
    expect(shellRule).toContain("overflow-y: auto");
    expect(shellRule).toContain("-webkit-overflow-scrolling: touch");
  });
});
