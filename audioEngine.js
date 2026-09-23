/* ==========================================================================
   VELOCITY X - WEB AUDIO ENGINE SYNTHESIZER
   Realistic procedural audio synthesis for hypercar engine revs & cube clicks
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isRevving = false;
    this.initContext();
  }

  initContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playCubeClink(intensity = 0.5) {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const pitch = 1200 + Math.random() * 800;
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.12);

    const volume = Math.min(0.2, 0.05 + intensity * 0.15);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  revEngine() {
    if (!this.ctx || this.isRevving) return;
    this.ensureContext();
    this.isRevving = true;

    const now = this.ctx.currentTime;
    const duration = 2.4;

    // Main V10/Electric Hypercar Saw Oscillator
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();

    const filter = this.ctx.createBiquadFilter();
    const masterGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    subOsc.type = 'triangle';

    // Pitch Envelope (Idle ~60Hz -> Rev ~340Hz -> Idle)
    osc1.frequency.setValueAtTime(70, now);
    osc1.frequency.exponentialRampToValueAtTime(360, now + 0.8);
    osc1.frequency.exponentialRampToValueAtTime(220, now + 1.4);
    osc1.frequency.exponentialRampToValueAtTime(420, now + 1.8);
    osc1.frequency.exponentialRampToValueAtTime(70, now + duration);

    osc2.frequency.setValueAtTime(70.5, now);
    osc2.frequency.exponentialRampToValueAtTime(362, now + 0.8);
    osc2.frequency.exponentialRampToValueAtTime(221, now + 1.4);
    osc2.frequency.exponentialRampToValueAtTime(422, now + 1.8);
    osc2.frequency.exponentialRampToValueAtTime(70.5, now + duration);

    subOsc.frequency.setValueAtTime(35, now);
    subOsc.frequency.exponentialRampToValueAtTime(180, now + 0.8);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + duration);

    // Filter Cutoff envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.8);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 1.4);
    filter.frequency.exponentialRampToValueAtTime(4500, now + 1.8);
    filter.frequency.exponentialRampToValueAtTime(250, now + duration);

    // Volume Envelope
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.2);
    masterGain.gain.setValueAtTime(0.35, now + 1.9);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect node chain
    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    // Start & Stop
    osc1.start(now);
    osc2.start(now);
    subOsc.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    subOsc.stop(now + duration);

    setTimeout(() => {
      this.isRevving = false;
    }, duration * 1000);
  }
}

export const audioEngine = new AudioEngine();
