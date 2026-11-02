import { SaveSystem } from './SaveSystem';

/**
 * AudioSystem - Sintetizador Chiptune 8-bit nativo via Web Audio API.
 * Garante efeitos sonoros autênticos retrô e música sem dependência de arquivos externos.
 * Controle avançado de volume Master, BGM e SFX com persistência em SaveSystem.
 */
export class AudioSystem {
  private static instance: AudioSystem;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private masterVolume = 0.8;
  private bgmVolume = 0.7;
  private sfxVolume = 0.8;
  private isMuted: boolean = false;

  private bgmPlaying: boolean = false;
  private bgmPending: boolean = false;
  private hasUserGesture: boolean = false;
  private currentTrack: 'title' | 'stage' | 'continue' = 'title';
  private schedulerInterval: number | null = null;
  private nextNoteTime = 0;
  private currentStep = 0;
  private noiseBuffer: AudioBuffer | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = SaveSystem.get().load().audio;
        if (saved) {
          this.masterVolume = Math.min(1, Math.max(0, saved.masterVolume ?? 0.8));
          this.bgmVolume = Math.min(1, Math.max(0, saved.bgmVolume ?? 0.7));
          this.sfxVolume = Math.min(1, Math.max(0, saved.sfxVolume ?? 0.8));
          this.isMuted = Boolean(saved.muted);
        }
      } catch {
        // Fallback default
      }

      const unlockAudio = () => {
        this.hasUserGesture = true;
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.bgmPending && !this.bgmPlaying && !this.isMuted) {
          this.bgmPending = false;
          this.startBgm(this.currentTrack);
        }
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  public static get(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain = this.ctx.createGain();

        this.sfxGain.connect(this.masterGain);
        this.bgmGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.applyGains();
      }
    }
    if (this.hasUserGesture && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private applyGains(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    }
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, now);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
    }
  }

  private saveSettings(): void {
    try {
      SaveSystem.get().save({
        audio: {
          masterVolume: this.masterVolume,
          bgmVolume: this.bgmVolume,
          sfxVolume: this.sfxVolume,
          muted: this.isMuted,
        },
      });
    } catch {
      // Ignora se localStorage indisponível
    }
  }

  public getMasterVolume(): number { return this.masterVolume; }
  public setMasterVolume(val: number): void {
    this.masterVolume = Math.min(1, Math.max(0, val));
    this.initCtx();
    this.applyGains();
    this.saveSettings();
  }

  public getBgmVolume(): number { return this.bgmVolume; }
  public setBgmVolume(val: number): void {
    this.bgmVolume = Math.min(1, Math.max(0, val));
    this.initCtx();
    this.applyGains();
    this.saveSettings();
  }

  public getSfxVolume(): number { return this.sfxVolume; }
  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.min(1, Math.max(0, val));
    this.initCtx();
    this.applyGains();
    this.saveSettings();
  }

  public getMuted(): boolean { return this.isMuted; }
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.initCtx();
    this.applyGains();
    if (this.isMuted && this.bgmPlaying) {
      this.stopBgm();
    } else if (!this.isMuted && !this.bgmPlaying && this.hasUserGesture) {
      this.startBgm(this.currentTrack);
    }
    this.saveSettings();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  private connectSfx(gain: GainNode, ctx: AudioContext): void {
    gain.connect(this.sfxGain || ctx.destination);
  }

  // Efeitos Sonoros 8-bit
  public playJump(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playShoot(charged = false): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = charged ? 'sawtooth' : 'square';
    if (charged) {
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    } else {
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    osc.connect(gain);
    this.connectSfx(gain, ctx);
  }

  public playCharge(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.35);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playHit(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playEnemyDefeat(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const now = ctx.currentTime;
    [180, 260, 360].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.04;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.06);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.06);

      osc.connect(gain);
      this.connectSfx(gain, ctx);

      osc.start(t);
      osc.stop(t + 0.07);
    });
  }

  public playPlayerHurt(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playStamp(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playPostcard(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.1);

      osc.connect(gain);
      this.connectSfx(gain, ctx);

      osc.start(t);
      osc.stop(t + 0.11);
    });
  }

  public playHeart(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const now = ctx.currentTime;
    [440, 660].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      this.connectSfx(gain, ctx);

      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  public playOneUp(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const notes = [330, 392, 659, 523, 587, 784];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      this.connectSfx(gain, ctx);

      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  public playCheckpoint(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const notes = [440, 554.37, 659.25, 880];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      this.connectSfx(gain, ctx);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playPuzzleSwitch(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.linearRampToValueAtTime(1080, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playBounce(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playVictory(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.28 },
      { f: 880.0, d: 0.14 },
      { f: 1046.5, d: 0.4 },
    ];

    let t = ctx.currentTime;
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.01, t + note.d);

      osc.connect(gain);
      this.connectSfx(gain, ctx);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d + 0.02;
    });
  }

  public playMenuNavigate(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playMenuSelect(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    this.connectSfx(gain, ctx);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // =========================================================================
  // SISTEMA DE MÚSICA CHIPTUNE 8-BIT AUTÊNTICO (MULTICANAL & INSPIRADO NOS CLÁSSICOS)
  // 4 Canais: Melodia (Pulse), Harmonia (Pulse 2), Baixo Groovy (Triangle) e Bateria (Noise)
  // =========================================================================

  private getNoiseBuffer(): AudioBuffer | null {
    if (this.noiseBuffer) return this.noiseBuffer;
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }

  private playNoise(time: number, duration: number, volume: number, highpassFreq: number): void {
    if (!this.ctx) return;
    const noiseBuffer = this.getNoiseBuffer();
    if (!noiseBuffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(highpassFreq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain || this.ctx.destination);

    source.start(time);
    source.stop(time + duration + 0.01);
  }

  public startBgm(track: 'title' | 'stage' | 'continue' = 'stage'): void {
    if (this.currentTrack === track && this.bgmPlaying) return;
    this.stopBgm();
    this.currentTrack = track;

    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      this.bgmPending = true;
      return;
    }

    this.bgmPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.04;

    // Scheduler com lookahead de 100ms para precisão rítmica absoluta (sem jitter de framerate)
    this.schedulerInterval = window.setInterval(() => {
      this.scheduleBgmTicks();
    }, 25);
  }

  public stopBgm(): void {
    this.bgmPlaying = false;
    this.bgmPending = false;
    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  public playContinueFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    const notes = [
      { f: 293.66, d: 0.09 }, // D4
      { f: 392.00, d: 0.09 }, // G4
      { f: 493.88, d: 0.09 }, // B4
      { f: 587.33, d: 0.28 }, // D5
    ];
    let t = now;
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.001, t + note.d);
      osc.connect(gain);
      this.connectSfx(gain, ctx);
      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.85;
    });
  }

  private scheduleBgmTicks(): void {
    if (!this.ctx || !this.bgmPlaying || this.isMuted || this.ctx.state === 'suspended') return;

    const isStage = this.currentTrack === 'stage';
    const isContinue = this.currentTrack === 'continue';
    // Tempo refinado
    const bpm = isStage ? 114 : isContinue ? 80 : 92;
    const stepDuration = 60 / bpm / 4; // Semicolcheia (16th note)
    const lookahead = 0.12;

    const melody = isStage ? STAGE_MELODY : isContinue ? CONTINUE_MELODY : TITLE_MELODY;
    const harmony = isStage ? STAGE_HARMONY : isContinue ? CONTINUE_HARMONY : TITLE_HARMONY;
    const bass = isStage ? STAGE_BASS : isContinue ? CONTINUE_BASS : TITLE_BASS;
    const drums = isStage ? STAGE_DRUMS : isContinue ? CONTINUE_DRUMS : TITLE_DRUMS;
    const patternLen = melody.length;

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const step = this.currentStep;
      const time = this.nextNoteTime;

      // 1. CANAL 1: MELODIA PRINCIPAL (Onda quadrada quente, suave e cantabile)
      const leadFreq = melody[step];
      if (leadFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Filtro mais aveludado e orgânico (elimina aspereza e estalo)
        filter.frequency.setValueAtTime(isStage ? 1900 : 1600, time);
        filter.Q.setValueAtTime(1.0, time);

        osc.type = 'square';
        osc.frequency.setValueAtTime(leadFreq, time);

        const noteLen = stepDuration * 1.8;
        const targetVol = isStage ? 0.082 : 0.065;
        // Ataque sutil de 14ms: nota surge suavemente sem estalo no início
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(targetVol, time + 0.014);
        gain.gain.exponentialRampToValueAtTime(targetVol * 0.55, time + noteLen * 0.75);
        gain.gain.linearRampToValueAtTime(0.0001, time + noteLen);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain || this.ctx.destination);

        osc.start(time);
        osc.stop(time + noteLen + 0.02);
      }

      // 2. CANAL 2: HARMONIA & CONTRACANTO (Almofada harmônica aveludada)
      const harmFreq = harmony[step];
      if (harmFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isStage ? 1400 : 1200, time);

        osc.type = 'square';
        osc.frequency.setValueAtTime(harmFreq, time);

        const noteLen = stepDuration * 1.7;
        const targetVol = isStage ? 0.038 : 0.028;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(targetVol, time + 0.018);
        gain.gain.exponentialRampToValueAtTime(targetVol * 0.45, time + noteLen * 0.7);
        gain.gain.linearRampToValueAtTime(0.0001, time + noteLen);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain || this.ctx.destination);

        osc.start(time);
        osc.stop(time + noteLen + 0.02);
      }

      // 3. CANAL 3: BAIXO GROOVY AVELUDADO (Triangle Wave encorpada e profunda)
      const bassFreq = bass[step];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, time); // Redondo, sem zumbido agudo

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, time);

        const noteLen = stepDuration * 1.6;
        const targetVol = isStage ? 0.12 : 0.095;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(targetVol, time + 0.012);
        gain.gain.exponentialRampToValueAtTime(targetVol * 0.5, time + noteLen * 0.75);
        gain.gain.linearRampToValueAtTime(0.0001, time + noteLen);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain || this.ctx.destination);

        osc.start(time);
        osc.stop(time + noteLen + 0.02);
      }

      // 4. CANAL 4: BATERIA RETRÔ SUAVE & ORGÂNICA (Toques acústicos 8-bit)
      const drum = drums[step];
      if (drum === 'K' || drum === 'B') {
        // Bumbo macio e quente
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(118, time);
        kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

        kickGain.gain.setValueAtTime(0.09, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.085);

        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain || this.ctx.destination);

        kickOsc.start(time);
        kickOsc.stop(time + 0.09);
      }

      if (drum === 'S') {
        // Caixa suave tipo pincel / estalo doce vintage
        this.playNoise(time, 0.055, 0.042, 1600);
      }

      if (drum === 'H' || drum === 'K' || drum === 'S') {
        // Chimbal discreto como brisa rítmica
        this.playNoise(time, 0.02, 0.018, 6500);
      }

      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % patternLen;
    }
  }
}

// =========================================================================
// TABELA DE FREQUÊNCIAS E PARTITURAS CHIPTUNE EM G MAIOR (Otimismo & Aventura)
// =========================================================================

const N = {
  E2: 82.41, Fs2: 92.50, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
  _: 0,
};

// --- TEMA DA FASE 1-1 "VALE DA BRISA" (114 BPM - Suave, Melódico, Nostálgico & Ensolarado) ---
// Suíte lírica de 8 compassos com respiração cantabile e harmonia rica em terças e sextas
const STAGE_MELODY: number[] = [
  // Compasso 1 (G Major): Frase inicial acolhedora e doce
  N.D4, N._,  N.G4, N._,  N.B4, N._,  N._,  N.D5,
  N._,  N.B4, N._,  N.G4, N.A4, N.B4, N.G4, N._,

  // Compasso 2 (Em7 / C Major): Voo suave sobre o vale
  N.E4, N._,  N.G4, N._,  N.C5, N._,  N._,  N.B4,
  N._,  N.A4, N._,  N.G4, N._,  N.E4, N._,  N._,

  // Compasso 3 (Am7 -> D7): Pergunta expressiva com arabesco melódico
  N.A4, N._,  N.C5, N._,  N.E5, N._,  N.D5, N._,
  N.B4, N._,  N.A4, N._,  N.Fs4, N.G4, N.A4, N._,

  // Compasso 4 (G Major): Resolução calorosa da estrofe
  N.B4, N._,  N.D5, N._,  N.G4, N._,  N._,  N.A4,
  N._,  N.B4, N._,  N.G4, N._,  N._,  N._,  N._,

  // Compasso 5 (C Major -> D/C): Abertura luminosa nos agudos (o sopro da brisa)
  N.C5, N._,  N.E5, N._,  N.G5, N._,  N._,  N.E5,
  N._,  N.D5, N._,  N.C5, N._,  N.D5, N._,  N._,

  // Compasso 6 (Bm7 -> Em7): Momento contemplativo e nostálgico
  N.D5, N._,  N.Fs5, N._, N.B4, N._,  N._,  N.D5,
  N._,  N.B4, N._,  N.G4, N._,  N.E4, N._,  N._,

  // Compasso 7 (Am7 -> D7): Crescendo melódico poético subindo com graça
  N.E4, N.Fs4, N.G4, N.A4, N.B4, N._,  N.C5, N._,
  N.D5, N._,  N.E5, N._,  N.Fs5, N._, N.D5, N._,

  // Compasso 8 (G Major): Resolução triunfante e suave de volta pra casa
  N.G5, N._,  N.D5, N._,  N.B4, N._,  N._,  N.C5,
  N.B4, N.A4, N.G4, N.G4, N.G4, N._,  N._,  N._,
];

const STAGE_HARMONY: number[] = [
  // Compasso 1: Terças aveludadas
  N.B3, N._,  N.D4, N._,  N.G4, N._,  N._,  N.B4,
  N._,  N.G4, N._,  N.D4, N.E4, N.G4, N.D4, N._,

  // Compasso 2
  N.C4, N._,  N.E4, N._,  N.G4, N._,  N._,  N.G4,
  N._,  N.Fs4, N._, N.E4, N._,  N.C4, N._,  N._,

  // Compasso 3
  N.Fs4, N._, N.A4, N._,  N.C5, N._,  N.B4, N._,
  N.G4, N._,  N.Fs4, N._, N.D4, N.E4, N.Fs4, N._,

  // Compasso 4
  N.G4, N._,  N.B4, N._,  N.D4, N._,  N._,  N.Fs4,
  N._,  N.G4, N._,  N.D4, N._,  N._,  N._,  N._,

  // Compasso 5
  N.E4, N._,  N.G4, N._,  N.C5, N._,  N._,  N.C5,
  N._,  N.B4, N._,  N.A4, N._,  N.B4, N._,  N._,

  // Compasso 6
  N.B4, N._,  N.D5, N._,  N.G4, N._,  N._,  N.B4,
  N._,  N.G4, N._,  N.E4, N._,  N.C4, N._,  N._,

  // Compasso 7
  N.C4, N.D4, N.E4, N.Fs4, N.G4, N._,  N.A4, N._,
  N.B4, N._,  N.C5, N._,  N.D5, N._,  N.A4, N._,

  // Compasso 8
  N.B4, N._,  N.G4, N._,  N.D4, N._,  N._,  N.E4,
  N.D4, N.C4, N.B3, N.B3, N.B3, N._,  N._,  N._,
];

const STAGE_BASS: number[] = [
  // Compasso 1 (G Major)
  N.G2, N._,  N.D3, N._,  N.G3, N._,  N.D3, N._,
  N.B2, N._,  N.D3, N._,  N.G2, N._,  N.D3, N._,

  // Compasso 2 (Em7 -> C Major)
  N.E2, N._,  N.B2, N._,  N.E3, N._,  N.B2, N._,
  N.C3, N._,  N.G3, N._,  N.C4, N._,  N.G3, N._,

  // Compasso 3 (Am7 -> D7)
  N.A2, N._,  N.E3, N._,  N.A3, N._,  N.E3, N._,
  N.D3, N._,  N.A3, N._,  N.D4, N._,  N.A3, N._,

  // Compasso 4 (G Major)
  N.G2, N._,  N.D3, N._,  N.G3, N._,  N.Fs3, N._,
  N.E3, N._,  N.D3, N._,  N.G2, N._,  N.D3, N._,

  // Compasso 5 (C Major)
  N.C3, N._,  N.G3, N._,  N.C4, N._,  N.G3, N._,
  N.E3, N._,  N.G3, N._,  N.C3, N._,  N.G3, N._,

  // Compasso 6 (Bm7 -> Em7)
  N.B2, N._,  N.Fs3, N._, N.B3, N._,  N.Fs3, N._,
  N.E2, N._,  N.B2, N._,  N.E3, N._,  N.B2, N._,

  // Compasso 7 (Am7 -> D7)
  N.A2, N._,  N.E3, N._,  N.A3, N._,  N.C4, N._,
  N.D3, N._,  N.A3, N._,  N.D4, N._,  N.Fs3, N._,

  // Compasso 8 (G Major)
  N.G2, N._,  N.D3, N._,  N.G3, N._,  N.D3, N._,
  N.B2, N._,  N.D3, N._,  N.G2, N._,  N._,  N._,
];

const STAGE_DRUMS: string[] = [
  // Compasso 1: Levada suave e arejada
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', '_', 'H', '_',  'S', '_', 'H', '_',

  // Compasso 2
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', '_', 'H', '_',  'S', '_', 'H', '_',

  // Compasso 3
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', '_', 'H', '_',  'S', '_', 'H', 'H',

  // Compasso 4
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', 'H', 'S', 'H',  'S', '_', 'H', '_',

  // Compasso 5
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', '_', 'H', '_',  'S', '_', 'H', '_',

  // Compasso 6
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', '_', 'H', '_',  'S', '_', 'H', '_',

  // Compasso 7
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', '_', 'H', '_',  'S', '_', 'H', 'H',

  // Compasso 8: Viradinha sutil e elegante
  'K', '_', 'H', '_',  'S', '_', 'H', '_',
  'K', 'H', 'S', 'H',  'S', 'S', 'H', '_',
];

// --- TEMA DA TELA INICIAL "O MIRANTE DO VALE" (92 BPM - Contemplativo, Doce e Nostálgico) ---
const TITLE_MELODY: number[] = [
  // Compasso 1
  N.D4, N._, N.G4, N._, N.B4, N._, N._,  N._,
  N.A4, N._, N.G4, N._, N.E4, N._, N._,  N._,

  // Compasso 2
  N.G4, N._, N.A4, N._, N.B4, N._, N.D5, N._,
  N.B4, N._, N._,  N._, N.A4, N._, N._,  N._,

  // Compasso 3
  N.D5, N._, N.B4, N._, N.G4, N._, N.A4, N._,
  N.B4, N._, N.G4, N._, N.E4, N._, N._,  N._,

  // Compasso 4
  N.D4, N._, N.E4, N._, N.G4, N._, N.A4, N._,
  N.G4, N._, N._,  N._, N._,  N._, N._,  N._,
];

const TITLE_HARMONY: number[] = [
  // Compasso 1
  N.B3, N._, N.D4, N._, N.G4, N._, N._,  N._,
  N.Fs4, N._, N.E4, N._, N.C4, N._, N._,  N._,

  // Compasso 2
  N.D4, N._, N.Fs4, N._, N.G4, N._, N.B4, N._,
  N.G4, N._, N._,  N._, N.Fs4, N._, N._,  N._,

  // Compasso 3
  N.B4, N._, N.G4, N._, N.D4, N._, N.Fs4, N._,
  N.G4, N._, N.E4, N._, N.C4, N._, N._,  N._,

  // Compasso 4
  N.B3, N._, N.C4, N._, N.D4, N._, N.Fs4, N._,
  N.D4, N._, N._,  N._, N._,  N._, N._,  N._,
];

const TITLE_BASS: number[] = [
  // Compasso 1: G - C
  N.G2, N._, N.D3, N._, N.G3, N._, N.D3, N._,
  N.C3, N._, N.G3, N._, N.C4, N._, N.G3, N._,

  // Compasso 2: Em - D
  N.E3, N._, N.B3, N._, N.E4, N._, N.B3, N._,
  N.D3, N._, N.A3, N._, N.D4, N._, N.A3, N._,

  // Compasso 3: Bm - C
  N.B2, N._, N.Fs3, N._, N.B3, N._, N.Fs3, N._,
  N.C3, N._, N.G3, N._, N.C4, N._, N.G3, N._,

  // Compasso 4: D - G
  N.D3, N._, N.A3, N._, N.D4, N._, N.A3, N._,
  N.G2, N._, N.D3, N._, N.G3, N._, N._,  N._,
];

const TITLE_DRUMS: string[] = [
  // Compasso 1
  'H', '_', 'H', '_',  'S', '_', 'H', '_',
  'H', '_', 'H', '_',  'S', '_', 'H', '_',

  // Compasso 2
  'H', '_', 'H', '_',  'S', '_', 'H', '_',
  'H', '_', 'H', '_',  'S', '_', 'H', '_',

  // Compasso 3
  'H', '_', 'H', '_',  'S', '_', 'H', '_',
  'H', '_', 'H', '_',  'S', '_', 'H', '_',

  // Compasso 4
  'H', '_', 'H', '_',  'S', '_', 'H', '_',
  'H', '_', 'H', '_',  'S', '_', 'H', '_',
];

// --- TEMA DO CONTINUE SCREEN (80 BPM - Melancólico, Acolhedor & Determinado) ---
// Inspirado nos clássicos Donkey Kong Country, Super Mario World e Sonic
const CONTINUE_MELODY: number[] = [
  // Compasso 1 (Em7): Frase reflexiva
  N.G4, N._, N.B4, N._, N.E5, N._, N._, N.D5,
  N._,  N.B4, N._, N.G4, N._,  N.A4, N._, N._,

  // Compasso 2 (Cmaj7): Esperança e fôlego
  N.E4, N._, N.G4, N._, N.B4, N._, N._, N.C5,
  N._,  N.G4, N._, N.E4, N._,  N.Fs4, N._, N._,

  // Compasso 3 (Am7): Resiliência
  N.C4, N._, N.E4, N._, N.G4, N._, N._, N.A4,
  N._,  N.G4, N._, N.E4, N._,  N.D4, N._, N._,

  // Compasso 4 (B7 / D#): Tensão antes da decisão
  N.Fs4, N._, N.A4, N._, N.B4, N._, N._, N.B4,
  N._,   N.A4, N._, N.Fs4, N._, N._,  N._, N._,
];

const CONTINUE_HARMONY: number[] = [
  // Compasso 1
  N.E4, N._, N.G4, N._, N.B4, N._, N._, N._,
  N.G4, N._, N.E4, N._, N.D4, N._, N._, N._,

  // Compasso 2
  N.C4, N._, N.E4, N._, N.G4, N._, N._, N._,
  N.E4, N._, N.C4, N._, N.D4, N._, N._, N._,

  // Compasso 3
  N.A3, N._, N.C4, N._, N.E4, N._, N._, N._,
  N.C4, N._, N.A3, N._, N.B3, N._, N._, N._,

  // Compasso 4
  N.B3, N._, N.Ds4, N._, N.Fs4, N._, N._, N._,
  N.Ds4, N._, N.B3, N._, N._,  N._, N._, N._,
];

const CONTINUE_BASS: number[] = [
  // Compasso 1 (Em)
  N.E2, N._, N.B2, N._, N.E3, N._, N.B2, N._,
  N.E2, N._, N.B2, N._, N.G2, N._, N.B2, N._,

  // Compasso 2 (C)
  N.C3, N._, N.G3, N._, N.C4, N._, N.G3, N._,
  N.C3, N._, N.G3, N._, N.E3, N._, N.G3, N._,

  // Compasso 3 (Am)
  N.A2, N._, N.E3, N._, N.A3, N._, N.E3, N._,
  N.A2, N._, N.E3, N._, N.C3, N._, N.E3, N._,

  // Compasso 4 (B)
  N.B2, N._, N.Fs3, N._, N.B3, N._, N.Fs3, N._,
  N.B2, N._, N.Fs3, N._, N.A2, N._, N.B2, N._,
];

const CONTINUE_DRUMS: string[] = [
  // Compasso 1 (Tique-taque suave e cadenciado de relógio/coração)
  'K', '_', 'H', '_',  'H', '_', 'H', '_',
  'H', '_', 'H', '_',  'H', '_', 'H', '_',

  // Compasso 2
  'K', '_', 'H', '_',  'H', '_', 'H', '_',
  'H', '_', 'H', '_',  'H', '_', 'H', '_',

  // Compasso 3
  'K', '_', 'H', '_',  'H', '_', 'H', '_',
  'H', '_', 'H', '_',  'H', '_', 'H', '_',

  // Compasso 4
  'K', '_', 'H', '_',  'H', '_', 'H', '_',
  'H', '_', 'H', '_',  'S', '_', 'H', '_',
];

