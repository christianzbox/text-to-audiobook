export type BlockType =
  | "article"
  | "paragraph"
  | "heading"
  | "reddit_post"
  | "reddit_comment"
  | "reddit_thread"
  | "forum_post"
  | "code"
  | "unknown";

export interface ReadableBlockMetadata {
  author?: string;
  score?: string;
  timestamp?: string;
  depth?: number;
  title?: string;
  elementPath?: string;
}

export interface ReadableBlock {
  id: string;
  text: string;
  htmlSnippet?: string;
  sourceUrl: string;
  pageTitle: string;
  blockType: BlockType;
  estimatedWords: number;
  estimatedSeconds: number;
  metadata?: ReadableBlockMetadata;
}

export interface ExtractionResult {
  title: string;
  url: string;
  blocks: ReadableBlock[];
  fullText: string;
  extractorName: string;
  warnings: string[];
}

export interface Chunk {
  id: string;
  text: string;
  index: number;
  estimatedWords: number;
  estimatedSeconds: number;
}

export interface ExtractionContext {
  url: string;
  title: string;
}

export interface RedditExtractionOptions {
  mode: "post_only" | "post_top_comments" | "selected_comment" | "selected_thread" | "top_comments";
  commentLimit: number;
  readUsernames: boolean;
  readScores: boolean;
  readTimestamps: boolean;
  skipAutoModerator: boolean;
  skipDeletedRemoved: boolean;
}
