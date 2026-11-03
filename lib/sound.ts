// Music and sound effects, all made in code with the Web Audio API (no audio files,
// nothing to license). Volumes come from Settings (0 to 1); 0 means off.

export type Sfx =
  | "click" | "hit" | "crit" | "slash" | "fire" | "thunder" | "laser" | "cosmic" | "dark" | "holy"
  | "heal" | "guard" | "buff" | "hurt" | "charge" | "dodge" | "enrage" | "ko" | "victory" | "defeat" | "coin" | "loot" | "door" | "open";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let vol = { music: 0.5, sfx: 0.7 };

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus.connect(master);
    sfxBus.connect(master);
    applyVolumes();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function applyVolumes() {
  if (!ctx || !musicBus || !sfxBus) return;
  // Squared so the slider feels even to the ear.
  musicBus.gain.setTargetAtTime(vol.music * vol.music * 0.55, ctx.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(vol.sfx * vol.sfx, ctx.currentTime, 0.02);
}

export function setVolumes(v: { music?: number; sfx?: number }) {
  vol = { music: clamp(v.music ?? 0.5), sfx: clamp(v.sfx ?? 0.7) };
  applyVolumes();
  if (vol.music === 0) stopMusic();
}

const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

// ---------- building blocks ----------

function tone(type: OscillatorType, freq: number, at: number, dur: number, gain: number, bus: AudioNode, slideTo?: number) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(bus);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function noise(at: number, dur: number, gain: number, bus: AudioNode, filter: BiquadFilterType = "lowpass", freq = 2000, freqTo?: number) {
  const c = ctx!;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, at);
  if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(bus);
  s.start(at, Math.random() * 0.5);
  s.stop(at + dur + 0.02);
}

const note = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** Plays a sound effect. Safe to call anywhere; does nothing when muted or on the server. */
export function sfx(name: Sfx) {
  if (vol.sfx === 0) return;
  const c = audio();
  if (!c || !sfxBus) return;
  const t = c.currentTime + 0.01;
  const b = sfxBus;
  switch (name) {
    case "click":
      tone("square", 880, t, 0.05, 0.12, b);
      break;
    case "hit":
      noise(t, 0.18, 0.7, b, "lowpass", 1800, 300);
      tone("square", 180, t, 0.15, 0.35, b, 60);
      break;
    case "crit":
      noise(t, 0.3, 0.9, b, "lowpass", 4000, 200);
      tone("square", 220, t, 0.25, 0.4, b, 50);
      tone("triangle", 1568, t + 0.02, 0.25, 0.25, b, 2093);
      break;
    case "slash":
      noise(t, 0.22, 0.6, b, "bandpass", 6000, 800);
      tone("sawtooth", 1200, t, 0.12, 0.12, b, 300);
      break;
    case "fire":
      noise(t, 0.6, 0.6, b, "lowpass", 900, 200);
      noise(t + 0.05, 0.4, 0.3, b, "bandpass", 2400, 600);
      break;
    case "thunder":
      noise(t, 0.08, 0.9, b, "highpass", 2000);
      noise(t + 0.06, 0.7, 0.7, b, "lowpass", 600, 80);
      tone("sawtooth", 90, t, 0.4, 0.25, b, 40);
      break;
    case "laser":
      for (let i = 0; i < 4; i++) tone("square", 1800, t + i * 0.07, 0.07, 0.15, b, 400);
      break;
    case "cosmic":
      tone("sine", 200, t, 0.9, 0.35, b, 1600);
      tone("triangle", 400, t + 0.1, 0.8, 0.2, b, 2400);
      noise(t + 0.5, 0.6, 0.6, b, "lowpass", 3000, 100);
      break;
    case "dark":
      tone("sawtooth", 160, t, 0.45, 0.25, b, 70);
      tone("sawtooth", 166, t, 0.45, 0.2, b, 72);
      break;
    case "holy":
      [72, 76, 79, 84].forEach((n, i) => tone("triangle", note(n), t + i * 0.05, 0.6, 0.18, b));
      break;
    case "heal":
      [67, 71, 74, 79].forEach((n, i) => tone("sine", note(n), t + i * 0.08, 0.35, 0.25, b));
      break;
    case "guard":
      tone("triangle", 660, t, 0.3, 0.25, b);
      tone("triangle", 990, t, 0.3, 0.15, b);
      noise(t, 0.06, 0.3, b, "highpass", 3000);
      break;
    case "buff":
      [60, 64, 67, 72, 76].forEach((n, i) => tone("square", note(n), t + i * 0.05, 0.12, 0.12, b));
      break;
    case "hurt":
      noise(t, 0.2, 0.6, b, "lowpass", 900, 100);
      tone("square", 120, t, 0.2, 0.3, b, 50);
      break;
    case "charge":
      tone("sawtooth", 80, t, 0.9, 0.2, b, 600);
      noise(t, 0.9, 0.2, b, "bandpass", 300, 3000);
      break;
    case "dodge":
      noise(t, 0.15, 0.3, b, "bandpass", 1500, 5000);
      break;
    case "enrage":
      tone("sawtooth", 110, t, 0.8, 0.3, b, 55);
      tone("square", 116, t, 0.8, 0.2, b, 58);
      noise(t, 0.8, 0.3, b, "lowpass", 500, 100);
      break;
    case "ko":
      tone("square", 440, t, 0.6, 0.3, b, 55);
      noise(t + 0.1, 0.8, 0.8, b, "lowpass", 1200, 60);
      break;
    case "victory": {
      const seq: [number, number][] = [[72, 0], [72, 0.12], [72, 0.24], [72, 0.36], [68, 0.6], [70, 0.84], [72, 1.08], [70, 1.26], [72, 1.38]];
      for (const [n, at] of seq) {
        tone("square", note(n), t + at, at === 1.38 ? 0.9 : 0.14, 0.18, b);
        tone("triangle", note(n - 12), t + at, at === 1.38 ? 0.9 : 0.14, 0.18, b);
      }
      break;
    }
    case "defeat":
      [67, 66, 65, 64].forEach((n, i) => tone("triangle", note(n), t + i * 0.3, i === 3 ? 0.9 : 0.3, 0.25, b));
      break;
    case "coin":
      tone("square", note(83), t, 0.08, 0.15, b);
      tone("square", note(88), t + 0.08, 0.3, 0.15, b);
      break;
    case "loot":
      [72, 76, 79, 84, 88].forEach((n, i) => tone("triangle", note(n), t + i * 0.07, 0.3, 0.2, b));
      break;
    case "door":
      tone("triangle", note(67), t, 0.09, 0.18, b);
      tone("triangle", note(74), t + 0.08, 0.14, 0.18, b);
      break;
    case "open":
      tone("square", note(79), t, 0.05, 0.1, b);
      tone("square", note(86), t + 0.05, 0.08, 0.1, b);
      break;
  }
}

/** One syllable of a character talking: a short blip at their voice's pitch (MIDI note). */
export function blip(pitch = 72) {
  if (vol.sfx === 0) return;
  const c = audio();
  if (!c || !sfxBus) return;
  tone("square", note(pitch + Math.floor(Math.random() * 3)), c.currentTime + 0.005, 0.045, 0.06, sfxBus);
}

// ---------- battle music: a small chiptune step sequencer ----------

let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextAt = 0;
let tempo = 150;

// A minor riff over i - VI - VII - i, 16 steps per bar, 4 bars. 0 = rest.
const BASS = [45, 0, 45, 57, 45, 0, 45, 57, 41, 0, 41, 53, 41, 0, 41, 53, 43, 0, 43, 55, 43, 0, 43, 55, 45, 0, 45, 57, 44, 0, 44, 56];
const LEAD = [
  69, 0, 72, 0, 76, 0, 74, 72, 74, 0, 72, 0, 71, 0, 67, 0,
  65, 0, 69, 0, 72, 0, 71, 69, 71, 0, 69, 0, 67, 0, 64, 0,
  67, 0, 71, 0, 74, 0, 72, 71, 72, 0, 74, 0, 76, 0, 79, 0,
  81, 0, 79, 76, 77, 0, 76, 74, 76, 0, 0, 0, 68, 0, 71, 0,
];

function scheduleStep(at: number, s: number) {
  const bus = musicBus!;
  const i = s % 64;
  const bass = BASS[Math.floor(i / 2)];
  if (i % 2 === 0 && bass) tone("triangle", note(bass - 12), at, 0.2, 0.5, bus);
  const lead = LEAD[i];
  if (lead) {
    tone("square", note(lead), at, 0.16, 0.09, bus);
    tone("square", note(lead) * 1.005, at, 0.16, 0.05, bus);
  }
  // Drums: kick on 1 and 3, snare on 2 and 4, hats on the off-beats.
  if (i % 8 === 0) tone("sine", 140, at, 0.18, 0.7, bus, 40);
  if (i % 8 === 4) noise(at, 0.14, 0.35, bus, "highpass", 1200);
  if (i % 2 === 1) noise(at, 0.03, 0.12, bus, "highpass", 7000);
}

export function startMusic() {
  if (vol.music === 0 || timer) return;
  const c = audio();
  if (!c || !musicBus) return;
  step = 0;
  nextAt = c.currentTime + 0.1;
  timer = setInterval(() => {
    const len = 60 / tempo / 4;
    while (nextAt < c.currentTime + 0.15) {
      scheduleStep(nextAt, step++);
      nextAt += len;
    }
  }, 30);
}

export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = null;
}

/** Faster music when the boss is enraged. */
export function setIntensity(high: boolean) {
  tempo = high ? 172 : 150;
}

export const musicPlaying = () => timer != null;
