"use client";

const MUSIC_SRC =
  "/audio/backgroundmusicmaster-fantasy-craft-loop-431346.mp3";
const MUSIC_VOLUME = 0.22;

// Web Audio API synthesizer for UI feedback (select / hover)
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playSelectSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      880,
      this.ctx.currentTime + 0.12,
    );

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playHoverSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

class MusicEngine {
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = true;
  private unlockBound: boolean = false;

  private ensureAudio() {
    if (this.audio || typeof window === "undefined") return;
    this.audio = new Audio(MUSIC_SRC);
    this.audio.loop = true;
    this.audio.volume = MUSIC_VOLUME;
    this.audio.preload = "auto";
  }

  /** Attempt to start playback; browsers may block until a user gesture. */
  public async start(): Promise<boolean> {
    this.ensureAudio();
    if (!this.audio || !this.enabled) return false;

    this.audio.volume = MUSIC_VOLUME;

    try {
      await this.audio.play();
      return true;
    } catch {
      this.bindUnlockOnce();
      return false;
    }
  }

  private bindUnlockOnce() {
    if (this.unlockBound || typeof window === "undefined") return;
    this.unlockBound = true;

    const unlock = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      this.unlockBound = false;
      if (this.enabled) {
        void this.start();
      }
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }

  public async toggle(): Promise<boolean> {
    this.ensureAudio();
    if (!this.audio) return false;

    this.enabled = !this.enabled;

    if (this.enabled) {
      await this.start();
    } else {
      this.audio.pause();
    }

    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundFx = new SoundEngine();
export const musicFx = new MusicEngine();
