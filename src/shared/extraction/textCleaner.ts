const UI_LINE_PATTERNS = [
  /^(upvote|downvote|reply|share|save|report|award|more|menu|subscribe|log in|sign up|promoted|advertisement)$/i,
  /^(give award|hide|collapse|expand|view discussions?|sort by|continue this thread)$/i,
  /^(permalink|embed|parent|context|full comments?)$/i,
  /^we (?:do not|don't) support that file type\.?$/i,
  /^try again with (?:a |an )?(?:gif|jpe?g|mov|mp4|png|svg|webm|csv|docx?|pdf|txt|zip)\b/i,
  /^(?:attach|upload) files? by dragging/i
];

const URL_PATTERN = /https?:\/\/[^\s)]+/gi;

export interface CleanTextOptions {
  removeUrls?: boolean;
  preserveParagraphs?: boolean;
}

export function cleanText(input: string, options: CleanTextOptions = {}): string {
  const removeUrls = options.removeUrls ?? true;
  const preserveParagraphs = options.preserveParagraphs ?? true;

  const normalized = input
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();

  const paragraphs = normalized
    .split(/\n{2,}|(?<=\.)\s{3,}/)
    .flatMap((part) => part.split("\n").map((line) => line.trim()).filter(Boolean))
    .map((line) => stripUiTokens(line, removeUrls))
    .filter(Boolean);

  const deduped = removeDuplicateLines(paragraphs);
  const joined = preserveParagraphs ? deduped.join("\n\n") : deduped.join(" ");

  return joined
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanInlineText(input: string): string {
  return cleanText(input, { preserveParagraphs: false });
}

function stripUiTokens(line: string, removeUrls: boolean): string {
  const withoutUrls = removeUrls
    ? line.replace(URL_PATTERN, (url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname.replace(/^www\./, "");
        } catch {
          return "";
        }
      })
    : line;

  const compact = withoutUrls
    .replace(/\b(upvote|downvote|reply|share|save|report|award|more|menu)\b/gi, (match, token, offset, source) => {
      const before = source.slice(Math.max(0, offset - 3), offset);
      const after = source.slice(offset + match.length, offset + match.length + 3);
      if (/[\w]/.test(before) || /[\w]/.test(after)) {
        return match;
      }
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();

  if (UI_LINE_PATTERNS.some((pattern) => pattern.test(compact))) {
    return "";
  }

  return compact;
}

function removeDuplicateLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const key = line.toLowerCase().replace(/\W+/g, " ").trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(line);
  }

  return result;
}
