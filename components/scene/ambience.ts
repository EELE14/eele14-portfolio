/* Copyright (c) 2026 eele14. All Rights Reserved. */

import { segmentAt } from "./keyframes";
import { audioContext } from "./sfx";

const LOOP_START = 0.5;
const LOOP_END = 30.5;

const KEYFRAMES = [
  { hour: 0, birds: 0, crickets: 0.5 },
  { hour: 4, birds: 0, crickets: 0.5 },
  { hour: 5, birds: 0.2, crickets: 0.3 },
  { hour: 6.5, birds: 0.5, crickets: 0 },
  { hour: 9, birds: 0.35, crickets: 0 },
  { hour: 16, birds: 0.25, crickets: 0 },
  { hour: 19, birds: 0.15, crickets: 0.1 },
  { hour: 20.5, birds: 0, crickets: 0.35 },
  { hour: 24, birds: 0, crickets: 0.5 },
];
const MASTER = { birds: 0.12, crickets: 0.14, rain: 0.15 };

let gains: {
  birds: GainNode;
  crickets: GainNode;
  rain: GainNode;
} | null = null;
let sources: AudioBufferSourceNode[] = [];
let starting = false;
let lastHour = 12;
let raining = false;
let ducked = false;

async function loopTrack(c: AudioContext, name: string): Promise<GainNode> {
  const res = await fetch(`/sounds/${name}.m4a`);
  const buffer = await c.decodeAudioData(await res.arrayBuffer());
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.loopStart = LOOP_START;
  src.loopEnd = LOOP_END;
  const gain = c.createGain();
  gain.gain.value = 0;
  src.connect(gain).connect(c.destination);
  src.start();
  sources.push(src);
  return gain;
}

export async function startAmbience() {
  if (gains || starting) return;
  starting = true;
  const c = audioContext();
  if (!c) return;
  const [birds, crickets, rain] = await Promise.all([
    loopTrack(c, "ambience-birds"),
    loopTrack(c, "ambience-crickets"),
    loopTrack(c, "ambience-rain"),
  ]);
  gains = { birds, crickets, rain };
  applyHour(lastHour, 2);
}

export function setAmbienceHour(hour: number) {
  lastHour = hour;
  applyHour(hour, 0.8);
}

export function setAmbienceRain(on: boolean) {
  raining = on;
  applyHour(lastHour, 1.2);
}

export function setAmbienceDucked(on: boolean) {
  ducked = on;
  applyHour(lastHour, 0.8);
}

function applyHour(hour: number, ramp: number) {
  const c = audioContext();
  if (!gains || !c) return;
  const [a, b, t] = segmentAt(KEYFRAMES, hour);
  const lerp = (x: number, y: number) => x + (y - x) * t;
  const duck = ducked ? 0.07 : 1;
  // wildlife quiets down while it rains
  gains.birds.gain.setTargetAtTime(
    lerp(a.birds, b.birds) * MASTER.birds * (raining ? 0.25 : 1) * duck,
    c.currentTime,
    ramp,
  );
  gains.crickets.gain.setTargetAtTime(
    lerp(a.crickets, b.crickets) * MASTER.crickets * (raining ? 0.5 : 1) * duck,
    c.currentTime,
    ramp,
  );
  gains.rain.gain.setTargetAtTime(
    (raining ? MASTER.rain : 0) * duck,
    c.currentTime,
    ramp,
  );
}

export function stopAmbience() {
  sources.forEach((src) => src.stop());
  sources = [];
  gains = null;
  starting = false;
}
