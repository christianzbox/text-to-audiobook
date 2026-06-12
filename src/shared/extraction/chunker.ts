import { stableHash } from "../utils/hash";
import { estimateListeningSeconds, estimateWordCount } from "../utils/timing";
import type { Chunk } from "./types";

export interface ChunkOptions {
  maxChars?: number;
}

export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? 3000;
  const clean = text.trim();
  if (!clean) {
    return [];
  }

  const units = splitIntoUnits(clean);
  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    if (unit.length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      chunks.push(...splitLongUnit(unit, maxChars));
      continue;
    }

    const candidate = current ? `${current}\n\n${unit}` : unit;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = unit;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.map((chunk, index) => ({
    id: `chunk-${index}-${stableHash(chunk)}`,
    text: chunk,
    index,
    estimatedWords: estimateWordCount(chunk),
    estimatedSeconds: estimateListeningSeconds(chunk)
  }));
}

function splitIntoUnits(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  return paragraphs.flatMap((paragraph) => {
    if (paragraph.length <= 3000) {
      return paragraph;
    }
    return splitSentences(paragraph);
  });
}

function splitSentences(text: string): string[] {
  const { protectedText, restore } = protectSentenceSensitiveTokens(text);
  const matches = protectedText.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g);
  return matches?.map((match) => restore(match).trim()).filter(Boolean) ?? [text];
}

function protectSentenceSensitiveTokens(text: string): { protectedText: string; restore: (value: string) => string } {
  const replacements = new Map<string, string>();
  let index = 0;
  const protect = (value: string): string => {
    const token = `__PAGEVOICE_TOKEN_${index}__`;
    index += 1;
    replacements.set(token, value);
    return token;
  };

  const protectedText = text
    .replace(/https?:\/\/[^\s)]+/gi, protect)
    .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|e\.g|i\.e)\./gi, protect);

  return {
    protectedText,
    restore: (value) => {
      let result = value;
      for (const [token, original] of replacements) {
        result = result.replaceAll(token, original);
      }
      return result;
    }
  };
}

function splitLongUnit(unit: string, maxChars: number): string[] {
  const sentences = splitSentences(unit);
  const result: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current.trim()) {
        result.push(current.trim());
        current = "";
      }
      result.push(...splitByClause(sentence, maxChars));
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = sentence;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function splitByClause(text: string, maxChars: number): string[] {
  const clauses = text.split(/(?<=[,;:])\s+/);
  const result: string[] = [];
  let current = "";

  for (const clause of clauses) {
    if (clause.length > maxChars) {
      if (current.trim()) {
        result.push(current.trim());
        current = "";
      }
      result.push(...splitHard(clause, maxChars));
      continue;
    }

    const candidate = current ? `${current} ${clause}` : clause;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = clause;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function splitHard(text: string, maxChars: number): string[] {
  const result: string[] = [];
  let index = 0;
  while (index < text.length) {
    let end = Math.min(index + maxChars, text.length);
    const slice = text.slice(index, end);
    const urlStart = slice.lastIndexOf("http");
    if (urlStart > maxChars * 0.75 && end < text.length) {
      end = index + urlStart;
    } else {
      const lastSpace = slice.lastIndexOf(" ");
      if (lastSpace > maxChars * 0.65) {
        end = index + lastSpace;
      }
    }
    result.push(text.slice(index, end).trim());
    index = end;
  }
  return result.filter(Boolean);
}
