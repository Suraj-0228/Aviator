/**
 * Web Audio API Sound Synthesizer (React Compatible)
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.isMuted = true;
  }

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopEngine();
    } else {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }
    return this.isMuted;
  }

  playBetClick() {
    if (this.isMuted || !this.audioCtx) return;
    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.frequency.setValueAtTime(400, time);
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(time + 0.06);
  }

  playCashoutChime() {
    if (this.isMuted || !this.audioCtx) return;
    const time = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc1.frequency.setValueAtTime(987.77, time); // B5
    osc2.frequency.setValueAtTime(1318.51, time + 0.06); // E6
    
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.setValueAtTime(0.08, time + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc1.start();
    osc2.start(time + 0.06);
    osc1.stop(time + 0.4);
    osc2.stop(time + 0.4);
  }

  playCrashExplosion() {
    if (this.isMuted || !this.audioCtx) return;
    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, time);
    osc.frequency.linearRampToValueAtTime(40, time + 0.5);
    
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(time + 0.7);
  }

  startEngine() {
    if (this.isMuted || !this.audioCtx) return;
    this.stopEngine();
    
    this.engineOsc = this.audioCtx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(45, this.audioCtx.currentTime);
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, this.audioCtx.currentTime);
    
    this.engineGain = this.audioCtx.createGain();
    this.engineGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
    
    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.audioCtx.destination);
    
    this.engineOsc.start();
  }

  updateEngine(multiplier) {
    if (this.isMuted || !this.engineOsc || !this.audioCtx) return;
    const freq = 45 + Math.min(200, (multiplier - 1.0) * 15);
    this.engineOsc.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.1);
    
    const gainVal = Math.min(0.12, 0.04 + (multiplier - 1.0) * 0.005);
    this.engineGain.gain.setTargetAtTime(gainVal, this.audioCtx.currentTime, 0.1);
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
    this.engineGain = null;
  }
}

export const soundEngine = new SoundEngine();
