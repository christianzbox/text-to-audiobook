const POSITIVE_HINTS = /(article|content|post|entry|story|comment|thread|body|main|markdown|prose|text|docs?|documentation|reader|discussion)/i;
const NEGATIVE_HINTS = /(nav|menu|footer|header|sidebar|advert|ads?|promo|cookie|modal|dialog|login|signup|toolbar|button|share|subscribe|breadcrumb|pagination|related|recommend)/i;
const READABLE_TAGS = new Set(["article", "main", "section", "p", "li", "blockquote", "pre"]);
const STRUCTURAL_TAGS = new Set(["div", "section", "article", "main", "li"]);

export function scoreReadableElement(element: Element): number {
  const text = normalizeText(element.textContent ?? "");
  if (text.length < 40) {
    return 0;
  }

  const linkTextLength = Array.from(element.querySelectorAll("a"))
    .map((link) => link.textContent?.trim().length ?? 0)
    .reduce((sum, length) => sum + length, 0);
  const buttonCount = element.querySelectorAll("button, input, select, textarea").length;
  const punctuationDensity = (text.match(/[.!?;,]/g)?.length ?? 0) / Math.max(1, text.length);
  const linkRatio = linkTextLength / Math.max(1, text.length);
  const tag = element.tagName.toLowerCase();
  const classId = `${element.getAttribute("class") ?? ""} ${element.id ?? ""}`;
  const paragraphCount = element.querySelectorAll("p, li, blockquote").length;
  const headingCount = element.querySelectorAll("h1, h2, h3, h4").length;
  const controlCount = element.querySelectorAll("button, input, select, textarea, [role='button'], [role='menuitem']").length;
  const directReadableText = getDirectReadableTextLength(element);

  let score = Math.min(170, text.length / 9);
  score += punctuationDensity * 280;

  if (["article", "main"].includes(tag)) {
    score += 38;
  } else if (["section", "blockquote"].includes(tag)) {
    score += 30;
  } else if (["p", "li"].includes(tag)) {
    score += 34;
  } else if (/^h[1-6]$/.test(tag)) {
    score += 10;
  }

  if (element.matches("[role='article'], [data-testid*='post'], [data-testid*='comment'], shreddit-comment, shreddit-post")) {
    score += 42;
  }
  if (headingCount > 0 && paragraphCount > 0) {
    score += Math.min(36, headingCount * 8 + paragraphCount * 5);
  }
  if (paragraphCount >= 2 && STRUCTURAL_TAGS.has(tag)) {
    score += Math.min(30, paragraphCount * 4);
  }
  if (directReadableText > 120 && READABLE_TAGS.has(tag)) {
    score += 16;
  }
  if (POSITIVE_HINTS.test(classId)) {
    score += 35;
  }
  if (NEGATIVE_HINTS.test(classId)) {
    score -= 80;
  }

  score -= linkRatio * 160;
  score -= buttonCount * 16;
  score -= controlCount * 18;

  if (text.length < 120 && !/^h[1-6]$/i.test(tag)) {
    score -= 25;
  }
  if (linkRatio > 0.55) {
    score -= 90;
  }
  if (controlCount >= 3 && controlCount / Math.max(1, paragraphCount) > 1.5) {
    score -= 90;
  }
  if (isLikelyChromeOrOverlay(element)) {
    score -= 120;
  }

  return Math.max(0, score);
}

export function isLikelyNavigation(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  const classId = `${element.getAttribute("class") ?? ""} ${element.id ?? ""}`;
  if (["nav", "footer", "aside", "form", "dialog"].includes(tag)) {
    return true;
  }
  if (NEGATIVE_HINTS.test(classId)) {
    return true;
  }
  const textLength = element.textContent?.trim().length ?? 0;
  const links = element.querySelectorAll("a").length;
  const buttons = element.querySelectorAll("button, [role='button']").length;
  if (links >= 5 && textLength > 0 && links / Math.max(1, textLength / 50) > 1.35) {
    return true;
  }
  return buttons >= 5 && textLength < 600;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getDirectReadableTextLength(element: Element): number {
  let length = 0;
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === 3) {
      length += normalizeText(node.textContent ?? "").length;
    }
  }
  return length;
}

function isLikelyChromeOrOverlay(element: Element): boolean {
  const role = element.getAttribute("role") ?? "";
  const aria = element.getAttribute("aria-label") ?? "";
  const classId = `${element.getAttribute("class") ?? ""} ${element.id ?? ""} ${role} ${aria}`;
  return NEGATIVE_HINTS.test(classId);
}
