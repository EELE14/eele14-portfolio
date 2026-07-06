/* Copyright (c) 2026 eele14. All Rights Reserved. */
// sound effects for room interactions. Foley sounds (switches, flicker,
// TV static, paper) are real recordings from /public/sounds (freesound.org,
// CC0, trimmed + normalized); the drawer slide and pong blips stay
// synthesized. All triggers are user-gesture driven, so the shared
// AudioContext is allowed to start.
let ctx: AudioContext | null = null;

// thx claude for this

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// ── samples ─────────────────────────────────────────────────────────
const SAMPLE_NAMES = [
  "lamp-switch",
  "switch",
  "flicker",
  "tv-static",
  "paper",
] as const;
type SampleName = (typeof SAMPLE_NAMES)[number];

const buffers = new Map<SampleName, Promise<AudioBuffer>>();

function sample(c: AudioContext, name: SampleName): Promise<AudioBuffer> {
  let buffer = buffers.get(name);
  if (!buffer) {
    buffer = fetch(`/sounds/${name}.m4a`)
      .then((res) => res.arrayBuffer())
      .then((data) => c.decodeAudioData(data));
    buffers.set(name, buffer);
  }
  return buffer;
}

function playSample(name: SampleName, gain: number, rate = 1) {
  const c = ac();
  if (!c) return;
  void sample(c, name).then((buffer) => {
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(g).connect(c.destination);
    src.start();
  });
}

// decode everything up front so the first click isn't late; the context may
// start suspended here (no gesture yet) — decoding still works
export function preloadSfx() {
  if (typeof window === "undefined") return;
  ctx ??= new AudioContext();
  for (const name of SAMPLE_NAMES) void sample(ctx, name);
}

export function sfxSwitch(on: boolean) {
  playSample("lamp-switch", 0.5, on ? 1 : 0.92);
}

export function sfxLampFlicker() {
  playSample("flicker", 0.55);
}

export function sfxTvZap() {
  playSample("switch", 0.45);
  playSample("tv-static", 0.35);
}

export function sfxPaper() {
  playSample("paper", 0.5, 0.96 + Math.random() * 0.08);
}

// ── synthesized ─────────────────────────────────────────────────────
// gain envelope routed to the destination: fast attack, exponential decay
function out(
  c: AudioContext,
  at: number,
  peak: number,
  decay: number,
  attack = 0.005,
): GainNode {
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0005, at + decay);
  gain.connect(c.destination);
  return gain;
}

function noise(c: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = c.createBuffer(
    1,
    Math.ceil(c.sampleRate * seconds),
    c.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  return src;
}

// wooden slide (matches the 0.45 s drawer animation); closing ends in a
// soft thump when the drawer hits the back
export function sfxDrawer(open: boolean) {
  const c = ac();
  if (!c) return;
  const at = c.currentTime;
  const slide = noise(c, 0.45);
  const lowpass = c.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 700;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.12, at + (open ? 0.08 : 0.18));
  gain.gain.linearRampToValueAtTime(0.02, at + 0.4);
  gain.gain.linearRampToValueAtTime(0, at + 0.45);
  slide.connect(lowpass).connect(gain).connect(c.destination);
  slide.start(at);

  if (!open) {
    const thump = c.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(90, at + 0.4);
    thump.frequency.exponentialRampToValueAtTime(50, at + 0.5);
    thump.connect(out(c, at + 0.4, 0.15, 0.12));
    thump.start(at + 0.4);
    thump.stop(at + 0.55);
  }
}

// the classic square-wave blips
export function sfxPong(kind: "paddle" | "wall" | "score") {
  const c = ac();
  if (!c) return;
  const at = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.value = kind === "paddle" ? 460 : kind === "wall" ? 230 : 180;
  const dur = kind === "score" ? 0.22 : 0.06;
  osc.connect(out(c, at, 0.04, dur, 0.002));
  osc.start(at);
  osc.stop(at + dur + 0.02);
}
