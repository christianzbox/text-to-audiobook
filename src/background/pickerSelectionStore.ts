import type { PendingPickerSelection, RuntimeMessage } from "../shared/messages/types";

let pendingSelection: PendingPickerSelection | null = null;

export function setPendingPickerSelection(message: Extract<RuntimeMessage, { type: "PICKER_SELECTED_BLOCK" }>): PendingPickerSelection {
  pendingSelection = {
    block: message.block,
    action: message.action ?? "read"
  };
  return pendingSelection;
}

export function takePendingPickerSelection(): PendingPickerSelection | null {
  const selection = pendingSelection;
  pendingSelection = null;
  return selection;
}

export function clearPendingPickerSelection(): void {
  pendingSelection = null;
}
