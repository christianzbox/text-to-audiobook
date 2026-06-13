import { afterEach, describe, expect, it } from "vitest";
import {
  clearPendingPickerSelection,
  setPendingPickerSelection,
  takePendingPickerSelection
} from "../../src/background/pickerSelectionStore";
import type { ReadableBlock } from "../../src/shared/extraction/types";

const block: ReadableBlock = {
  id: "picked-block",
  text: "This is the readable text selected from the page.",
  sourceUrl: "https://example.com/article",
  pageTitle: "Picked block",
  blockType: "article",
  estimatedWords: 10,
  estimatedSeconds: 4,
  metadata: {}
};

describe("pickerSelectionStore", () => {
  afterEach(() => {
    clearPendingPickerSelection();
  });

  it("stores and consumes the latest picked block once", () => {
    setPendingPickerSelection({ type: "PICKER_SELECTED_BLOCK", block, action: "queue" });

    expect(takePendingPickerSelection()).toEqual({ block, action: "queue" });
    expect(takePendingPickerSelection()).toBeNull();
  });

  it("defaults picker selections to read behavior", () => {
    setPendingPickerSelection({ type: "PICKER_SELECTED_BLOCK", block });

    expect(takePendingPickerSelection()).toEqual({ block, action: "read" });
  });
});
