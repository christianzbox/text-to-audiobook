import type { AudioStatus } from "../shared/messages/types";

export interface AudioState {
  status: AudioStatus;
  detail?: string;
}

let audioState: AudioState = { status: "idle" };

export function getAudioState(): AudioState {
  return audioState;
}

export function setAudioState(status: AudioStatus, detail?: string): AudioState {
  audioState = { status, detail };
  return audioState;
}
