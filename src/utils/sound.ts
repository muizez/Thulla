class CardSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicEnabled = false;
  private musicTimer: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stopMusic();
  }

  isMuted() {
    return this.muted;
  }

  isMusicOn() {
    return this.musicEnabled;
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled && !this.muted) {
      this.startMusicLoop();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  private startMusicLoop() {
    if (this.musicTimer) return;
    const playBar = () => {
      if (!this.musicEnabled || this.muted) return;
      const notes = [220, 261.63, 329.63, 392.0];
      notes.forEach((freq, idx) => {
        this.tone(freq, 0.9, 'sine', 0.015, idx * 0.45);
      });
    };
    playBar();
    this.musicTimer = window.setInterval(playBar, 2400);
  }

  private stopMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.06,
    delay = 0
  ) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainVal, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  playShuffle() {
    for (let i = 0; i < 6; i++) {
      this.tone(240 + i * 35, 0.04, 'triangle', 0.04, i * 0.035);
    }
  }

  playCardPlace() {
    this.tone(310, 0.05, 'triangle', 0.07, 0);
    this.tone(480, 0.07, 'sine', 0.04, 0.02);
  }

  playCardSelect() {
    this.tone(580, 0.04, 'sine', 0.035);
  }

  playTurnNotify() {
    this.tone(523.25, 0.08, 'sine', 0.05, 0);
    this.tone(659.25, 0.12, 'sine', 0.05, 0.08);
  }

  playThullaAlert() {
    this.tone(220, 0.14, 'sawtooth', 0.05, 0);
    this.tone(165, 0.22, 'sawtooth', 0.05, 0.12);
  }

  playVictory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
      this.tone(n, 0.35, 'triangle', 0.07, i * 0.09);
    });
  }
}

export const soundFx = new CardSoundEngine();
