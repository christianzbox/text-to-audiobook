export class OffscreenAudioPlayer {
  private audio: HTMLAudioElement | null = null;

  play(url: string): Promise<void> {
    this.stop();
    this.audio = new Audio(url);
    return new Promise((resolve, reject) => {
      if (!this.audio) {
        reject(new Error("Audio player unavailable."));
        return;
      }
      this.audio.onended = () => resolve();
      this.audio.onerror = () => reject(new Error("Audio playback failed."));
      void this.audio.play().catch(reject);
    });
  }

  pause(): void {
    this.audio?.pause();
  }

  resume(): void {
    void this.audio?.play();
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
  }
}
