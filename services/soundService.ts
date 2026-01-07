
class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 0.1) {
    if (this.muted) return;
    this.initCtx();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + duration);
  }

  playTap() {
    this.playTone(880, 'sine', 0.1, 0.05);
  }

  playRef() {
    this.playTone(440, 'triangle', 0.15, 0.05);
  }

  playWin() {
    const now = this.ctx?.currentTime || 0;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.2, 0.03), i * 100);
    });
  }

  playLose() {
    const now = this.ctx?.currentTime || 0;
    [392.00, 311.13, 261.63].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.3, 0.03), i * 150);
    });
  }

  playDraw() {
    this.playTone(349.23, 'sine', 0.2, 0.05);
    setTimeout(() => this.playTone(349.23, 'sine', 0.2, 0.05), 100);
  }

  playBomb() {
    if (this.muted) return;
    this.initCtx();
    const bufferSize = this.ctx!.sampleRate * 0.5;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx!.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx!.currentTime + 0.5);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx!.destination);

    noise.start();
  }
}

export const sounds = new SoundService();
