import { browserApi } from "../shared/browser/browserApi";
import type { RuntimeMessage } from "../shared/messages/types";
import { OffscreenAudioPlayer } from "./audioPlayer";

const player = new OffscreenAudioPlayer();

browserApi.runtime.onMessage((message: RuntimeMessage) => {
  switch (message.type) {
    case "PAUSE":
      player.pause();
      return { ok: true };
    case "RESUME":
      player.resume();
      return { ok: true };
    case "STOP":
      player.stop();
      return { ok: true };
    default:
      return undefined;
  }
});
