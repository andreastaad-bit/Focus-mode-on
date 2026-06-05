// Audio Engine using Web Audio API for binaural beats, river generator, and tibetan bowls

export class AudioEngine {
  private ctx: AudioContext | null = null;
  
  // Binaural nodes
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftPanner: StereoPannerNode | null = null;
  private rightPanner: StereoPannerNode | null = null;
  private binauralGain: GainNode | null = null;
  
  // Ambient nodes (River simulator)
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private riverLFO: OscillatorNode | null = null;
  private riverLFOGain: GainNode | null = null;

  // Doodle music nodes
  private doodleInterval: number | null = null;
  private doodleGain: GainNode | null = null;

  // Master Gain
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Volumes
  private volBinauralVal = 0.15;
  private volAmbientVal = 0.25;
  private volDoodleVal = 0.20;

  constructor() {}

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Setup master node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // Create Analyser for real-time visualization
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256; // Gives 128 frequency bins
      
      // Route signal: masterGain -> analyser -> destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Create distinct GAIN nodes for channels
      this.binauralGain = this.ctx.createGain();
      this.binauralGain.gain.setValueAtTime(this.volBinauralVal, this.ctx.currentTime);
      this.binauralGain.connect(this.masterGain);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(this.volAmbientVal, this.ctx.currentTime);
      this.noiseGain.connect(this.masterGain);

      this.doodleGain = this.ctx.createGain();
      this.doodleGain.gain.setValueAtTime(this.volDoodleVal, this.ctx.currentTime);
      this.doodleGain.connect(this.masterGain);
    } catch (e) {
      console.error("Failed to initialize Web Audio Context", e);
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolumes(binaural: number, ambient: number, doodle: number) {
    this.volBinauralVal = binaural;
    this.volAmbientVal = ambient;
    this.volDoodleVal = doodle;

    if (this.binauralGain && this.ctx) {
      this.binauralGain.gain.setTargetAtTime(binaural, this.ctx.currentTime, 0.1);
    }
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.setTargetAtTime(ambient, this.ctx.currentTime, 0.1);
    }
    if (this.doodleGain && this.ctx) {
      this.doodleGain.gain.setTargetAtTime(doodle, this.ctx.currentTime, 0.1);
    }
  }

  // --- BINAURAL BEATS ---
  public startBinaural(carrierHz: number, beatHz: number) {
    this.resume();
    this.stopBinaural();

    if (!this.ctx || !this.binauralGain) return;

    try {
      const t = this.ctx.currentTime;
      // Setup Left channel (carrier frequency)
      this.leftOsc = this.ctx.createOscillator();
      this.leftOsc.type = "sine";
      this.leftOsc.frequency.setValueAtTime(carrierHz, t);

      this.leftPanner = this.ctx.createStereoPanner();
      this.leftPanner.pan.setValueAtTime(-1.0, t);

      // Setup Right channel (carrier + beat frequency)
      this.rightOsc = this.ctx.createOscillator();
      this.rightOsc.type = "sine";
      this.rightOsc.frequency.setValueAtTime(carrierHz + beatHz, t);

      this.rightPanner = this.ctx.createStereoPanner();
      this.rightPanner.pan.setValueAtTime(1.0, t);

      // Connections
      this.leftOsc.connect(this.leftPanner).connect(this.binauralGain);
      this.rightOsc.connect(this.rightPanner).connect(this.binauralGain);

      // Start
      this.leftOsc.start(t);
      this.rightOsc.start(t);
    } catch (e) {
      console.error("Error executing AudioEngine.startBinaural", e);
    }
  }

  public stopBinaural() {
    try {
      if (this.leftOsc) {
        this.leftOsc.stop();
        this.leftOsc.disconnect();
        this.leftOsc = null;
      }
      if (this.rightOsc) {
        this.rightOsc.stop();
        this.rightOsc.disconnect();
        this.rightOsc = null;
      }
      if (this.leftPanner) {
        this.leftPanner.disconnect();
        this.leftPanner = null;
      }
      if (this.rightPanner) {
        this.rightPanner.disconnect();
        this.rightPanner = null;
      }
    } catch (e) {
      // already stopped/disconnected
    }
  }

  // --- AMBIENT NOISE (GENTLE RIVER) ---
  public startAmbient() {
    this.resume();
    this.stopAmbient();

    if (!this.ctx || !this.noiseGain) return;

    try {
      const t = this.ctx.currentTime;
      
      // Generate water sound based on stylized pink/brown noise
      const bufferSize = 4 * this.ctx.sampleRate; // 4 seconds of unique noise
      const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0;
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink noise filter approximation
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          
          data[i] = pink * 0.05; // lower gain noise base
        }
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      // Filter to simulate murmuring water
      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = "lowpass";
      this.noiseFilter.frequency.setValueAtTime(320, t); // fluid murmur freq
      this.noiseFilter.Q.setValueAtTime(1.5, t);

      // Low frequency modulation (LFO) to simulate wave ripples
      this.riverLFO = this.ctx.createOscillator();
      this.riverLFO.type = "sine";
      this.riverLFO.frequency.setValueAtTime(0.12, t); // very slow ocean cycle

      this.riverLFOGain = this.ctx.createGain();
      this.riverLFOGain.gain.setValueAtTime(100, t); // swings lowpass frequency +/-100 Hz

      // Connect LFO to modulate Lowpass filter frequency
      this.riverLFO.connect(this.riverLFOGain);
      this.riverLFOGain.connect(this.noiseFilter.frequency);

      // Connections
      this.noiseNode.connect(this.noiseFilter).connect(this.noiseGain);

      // Start river flow
      this.noiseNode.start(t);
      this.riverLFO.start(t);
    } catch (e) {
      console.error("Error executing AudioEngine.startAmbient", e);
    }
  }

  public stopAmbient() {
    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.noiseFilter) {
        this.noiseFilter.disconnect();
        this.noiseFilter = null;
      }
      if (this.riverLFO) {
        this.riverLFO.stop();
        this.riverLFO.disconnect();
        this.riverLFO = null;
      }
      if (this.riverLFOGain) {
        this.riverLFOGain.disconnect();
        this.riverLFOGain = null;
      }
    } catch (e) {
      // already stopped/disconnected
    }
  }

  // --- DOODLE CALMING MUSIC LOOP ---
  private playDoodleChord(chords: number[]) {
    if (!this.ctx || !this.doodleGain) return;
    const t = this.ctx.currentTime;

    try {
      chords.forEach((freq, idx) => {
        // Soft synth voice (triangle + sine combo)
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        const gainNode = this.ctx!.createGain();

        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(freq, t);
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq * 1.005, t); // gentle detune for chorusing

        gainNode.gain.setValueAtTime(0.0, t);
        gainNode.gain.linearRampToValueAtTime(0.04, t + 1.2); // soft attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); // long release

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.doodleGain!);

        osc1.start(t);
        osc1.stop(t + 5);
        osc2.start(t);
        osc2.stop(t + 5);
      });
    } catch (e) {
      console.error(e);
    }
  }

  public startDoodleMusic() {
    this.resume();
    this.stopDoodleMusic();

    if (!this.ctx) return;

    // Peaceful celestial chords (Fmaj9, Cmaj9, Gsus4, Am9)
    const chordsList = [
      [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
      [130.81, 196.00, 261.63, 329.63, 392.00], // Cmaj9
      [196.00, 293.66, 392.00, 440.00, 523.25], // Gsus4
      [110.00, 220.00, 261.63, 329.63, 440.00]  // Am9
    ];

    let currentChordIdx = 0;
    
    // Play immediately
    this.playDoodleChord(chordsList[currentChordIdx]);
    currentChordIdx = (currentChordIdx + 1) % chordsList.length;

    // Loop
    this.doodleInterval = window.setInterval(() => {
      this.playDoodleChord(chordsList[currentChordIdx]);
      currentChordIdx = (currentChordIdx + 1) % chordsList.length;
    }, 5000);
  }

  public stopDoodleMusic() {
    if (this.doodleInterval) {
      clearInterval(this.doodleInterval);
      this.doodleInterval = null;
    }
  }

  // --- TIBETAN CHIME / BOX BREATHING BELL ---
  public playChime() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      // Synthesize a Tibetan Singing Bowl strike by stacking 4 harmonic / slightly inharmonic tones
      const frequencies = [220, 331.5, 440, 584.2]; // rich resonance
      const gainsValues = [0.12, 0.08, 0.06, 0.04];
      const decayTimes = [4.5, 3.2, 2.0, 1.2]; // higher freqs decay faster!

      frequencies.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gainNode = this.ctx!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        
        // Slight vibrato
        const vibrato = this.ctx!.createOscillator();
        const vibratoGain = this.ctx!.createGain();
        vibrato.frequency.setValueAtTime(4.5, t); // 4.5Hz wobble
        vibratoGain.gain.setValueAtTime(1.5, t); // amplitude swing
        
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);

        gainNode.gain.setValueAtTime(0.0001, t);
        // Striking hammer attack
        gainNode.gain.linearRampToValueAtTime(gainsValues[idx], t + 0.08);
        // Resonant ring decline
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t + decayTimes[idx]);

        // Connect
        osc.connect(gainNode).connect(this.masterGain!);
        
        // Trigger
        vibrato.start(t);
        osc.start(t);

        vibrato.stop(t + decayTimes[idx]);
        osc.stop(t + decayTimes[idx]);
      });
    } catch (e) {
      console.error("Failed to play Tibetan Bowl chime", e);
    }
  }

  public stopAll() {
    this.stopBinaural();
    this.stopAmbient();
    this.stopDoodleMusic();
  }
}
export const globalAudioEngine = new AudioEngine();
