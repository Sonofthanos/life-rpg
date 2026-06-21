// Web Audio API Retro Chiptune Sound Synthesizer & Sequencer
// Handles dungeon war BGM and retro game SFX

let audioCtx = null;
let masterGain = null;
let bgmGain = null;
let sfxGain = null;
let isMuted = false;

// Sequencer state
let isPlaying = false;
let nextNoteTime = 0.0;
let currentStep = 0;
let schedulerTimer = null;

const TEMPO = 135; // Beats per minute
const stepDuration = 60.0 / TEMPO / 4; // duration of a 16th note (approx 0.111s)
const lookahead = 0.1; // how far ahead to schedule audio (sec)
const scheduleInterval = 25.0; // how often to check for notes to schedule (ms)

// E minor scale frequencies
// Bass notes (octave 2/3)
const E2 = 82.41;
const G2 = 98.00;
const A2 = 110.00;
const B2 = 123.47;
const C3 = 130.81;
const D3 = 146.83;
const E3 = 164.81;
const G3 = 196.00;
const A3 = 220.00;
const B3 = 246.94;

// Lead notes (octave 4/5)
const D4 = 293.66;
const E4 = 329.63;
const Fs4 = 369.99;
const G4 = 392.00;
const A4 = 440.00;
const B4 = 493.88;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const Fs5 = 739.99;
const G5 = 783.99;

// 64-step sequence (4 measures in 16th notes)
const BASS_SEQ = [
  // Measure 1: driving E2 bassline
  E2, 0, E2, E2, G2, 0, A2, 0,
  E2, 0, E2, E2, D3, 0, B2, 0,
  // Measure 2: harmonic shift to C3
  C3, 0, C3, C3, E3, 0, G3, 0,
  D3, 0, D3, D3, A2, 0, D3, 0,
  // Measure 3: driving E2 bassline variations
  E2, 0, E2, E2, G2, 0, A2, 0,
  E2, 0, E2, E2, D3, 0, B2, 0,
  // Measure 4: rising tension bass climb
  C3, 0, C3, 0, D3, 0, D3, 0,
  E3, 0, G3, 0, A3, B3, 0, 0
];

const LEAD_SEQ = [
  // Measure 1: tense battle intro
  E4, 0, E4, G4, A4, 0, B4, 0,
  E4, 0, E4, G4, Fs4, 0, D4, 0,
  // Measure 2: minor resolution
  E4, 0, E4, G4, A4, 0, B4, 0,
  C5, 0, B4, A4, G4, 0, Fs4, 0,
  // Measure 3: octave jump melody
  E5, 0, E5, 0, D5, 0, B4, 0,
  A4, 0, B4, 0, G4, 0, E4, 0,
  // Measure 4: climbing phrase
  C5, 0, C5, D5, E5, 0, E5, Fs5,
  G5, 0, Fs5, 0, E5, D5, B4, 0
];

// White noise buffer generator for drums (snare & hi-hat)
let noiseBuffer = null;
const getNoiseBuffer = (ctx) => {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
};

// Initialize Audio Context lazily
export const initAudio = () => {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    audioCtx = new AudioContextClass();
    
    // Master volume control
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : 0.7, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
    
    // BGM mixing channel
    bgmGain = audioCtx.createGain();
    bgmGain.gain.setValueAtTime(0.18, audioCtx.currentTime); // keep BGM slightly softer
    bgmGain.connect(masterGain);
    
    // SFX mixing channel
    sfxGain = audioCtx.createGain();
    sfxGain.gain.setValueAtTime(0.4, audioCtx.currentTime); // keep SFX crispy and clear
    sfxGain.connect(masterGain);
  } catch (e) {
    console.warn("Failed to initialize AudioContext", e);
  }
};

// Synthesized drum hits
const playKick = (ctx, time, output) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(output);
  
  osc.frequency.setValueAtTime(130, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.08);
  
  gain.gain.setValueAtTime(0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
  
  osc.start(time);
  osc.stop(time + 0.08);
};

const playSnare = (ctx, time, output) => {
  // Noise component
  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = getNoiseBuffer(ctx);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  
  const noiseGain = ctx.createGain();
  bufferSource.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(output);
  
  noiseGain.gain.setValueAtTime(0.10, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
  
  bufferSource.start(time);
  bufferSource.stop(time + 0.12);
  
  // Punch tone component
  const osc = ctx.createOscillator();
  const toneGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.07);
  
  osc.connect(toneGain);
  toneGain.connect(output);
  
  toneGain.gain.setValueAtTime(0.08, time);
  toneGain.gain.exponentialRampToValueAtTime(0.01, time + 0.07);
  
  osc.start(time);
  osc.stop(time + 0.07);
};

const playHat = (ctx, time, output) => {
  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = getNoiseBuffer(ctx);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 8500;
  
  const gain = ctx.createGain();
  bufferSource.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  
  gain.gain.setValueAtTime(0.06, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  
  bufferSource.start(time);
  bufferSource.stop(time + 0.04);
};

// Bass synth tone
const playBass = (ctx, time, freq, duration, output) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  
  // Rich retro filtering
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, time);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  
  gain.gain.setValueAtTime(0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01);
  
  osc.start(time);
  osc.stop(time + duration);
};

// Lead melodic synth tone
const playLead = (ctx, time, freq, duration, output) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);
  
  osc.connect(gain);
  gain.connect(output);
  
  gain.gain.setValueAtTime(0.05, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);
  
  osc.start(time);
  osc.stop(time + duration);
};

// Scheduler function called recursively
const scheduleNote = (step, time) => {
  if (!audioCtx || !bgmGain) return;
  
  // Play drums rhythm
  // Kick on beats (step 0, 4, 8, 12, etc)
  if (step % 4 === 0) {
    playKick(audioCtx, time, bgmGain);
  }
  // Snare on backbeats (step 4, 12, 20, 28, etc)
  if (step % 8 === 4) {
    playSnare(audioCtx, time, bgmGain);
  }
  // Hi-hat on offbeats
  if (step % 2 === 1) {
    playHat(audioCtx, time, bgmGain);
  }
  
  // Play bass note
  const bassFreq = BASS_SEQ[step];
  if (bassFreq && bassFreq > 0) {
    playBass(audioCtx, time, bassFreq, stepDuration * 0.9, bgmGain);
  }
  
  // Play lead melody
  const leadFreq = LEAD_SEQ[step];
  if (leadFreq && leadFreq > 0) {
    playLead(audioCtx, time, leadFreq, stepDuration * 1.5, bgmGain);
  }
};

// Start Dungeon War Music Loop
export const startBattleMusic = () => {
  initAudio();
  if (!audioCtx) return;
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  if (isPlaying) return;
  isPlaying = true;
  
  nextNoteTime = audioCtx.currentTime + 0.05;
  currentStep = 0;
  
  schedulerTimer = setInterval(() => {
    if (!audioCtx) return;
    
    while (nextNoteTime < audioCtx.currentTime + lookahead) {
      scheduleNote(currentStep, nextNoteTime);
      nextNoteTime += stepDuration;
      currentStep = (currentStep + 1) % 64;
    }
  }, scheduleInterval);
};

// Stop Dungeon War Music Loop
export const stopBattleMusic = () => {
  if (!isPlaying) return;
  isPlaying = false;
  
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
};

// Set global volume mute state
export const setMute = (mute) => {
  isMuted = mute;
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(mute ? 0 : 0.7, audioCtx.currentTime);
  }
};

// Return if audio is currently muted
export const getMuted = () => isMuted;

// SFX: Hit Sound effect when attacking
export const playHitSound = () => {
  initAudio();
  if (!audioCtx || isMuted) return;
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const time = audioCtx.currentTime;
  
  // White noise sword slash
  const bufferSource = audioCtx.createBufferSource();
  bufferSource.buffer = getNoiseBuffer(audioCtx);
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'peaking';
  filter.Q.value = 5;
  filter.frequency.setValueAtTime(1200, time);
  filter.frequency.exponentialRampToValueAtTime(100, time + 0.15);
  
  const gain = audioCtx.createGain();
  bufferSource.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  
  gain.gain.setValueAtTime(0.15, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
  
  bufferSource.start(time);
  bufferSource.stop(time + 0.15);
  
  // Low pitch hit punch
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
  
  osc.connect(oscGain);
  oscGain.connect(sfxGain);
  
  oscGain.gain.setValueAtTime(0.2, time);
  oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
  
  osc.start(time);
  osc.stop(time + 0.1);
};

// SFX: Victory fanfare when level up
export const playLevelUpSound = () => {
  initAudio();
  if (!audioCtx || isMuted) return;
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const time = audioCtx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6 arpeggio
  const noteDur = 0.08;
  
  notes.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time + idx * noteDur);
    
    osc.connect(gain);
    gain.connect(sfxGain);
    
    const playTime = time + idx * noteDur;
    gain.gain.setValueAtTime(0.08, playTime);
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.3);
    
    osc.start(playTime);
    osc.stop(playTime + 0.35);
  });
};

// SFX: Retro Beep Alarm Synthesizer (ported and improved)
export const playAlarmSound = () => {
  initAudio();
  if (!audioCtx || isMuted) return;
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  
  const playBeep = (time, freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(sfxGain);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.03);
    
    osc.start(time);
    osc.stop(time + duration);
  };

  playBeep(now, 880, 0.15);      // A5 Note
  playBeep(now + 0.2, 880, 0.15);
  playBeep(now + 0.4, 880, 0.15);
  playBeep(now + 0.6, 1200, 0.35); // High beep
};
