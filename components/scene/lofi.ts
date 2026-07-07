/* Copyright (c) 2026 eele14. All Rights Reserved. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timers: ReturnType<typeof setInterval>[] = [];

const CHORDS: number[][] = [
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [130.81, 164.81, 196.0, 246.94],
  [196.0, 246.94, 293.66, 392.0],
];

function playChord(freqs: number[], at: number, duration: number) {
  if (!ctx || !master) return;
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.045, at + 0.6);
    gain.gain.setValueAtTime(0.045, at + duration - 0.8);
    gain.gain.linearRampToValueAtTime(0, at + duration);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + duration);
  }
}

function playKick(at: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, at);
  osc.frequency.exponentialRampToValueAtTime(40, at + 0.12);
  gain.gain.setValueAtTime(0.16, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.25);
  osc.connect(gain).connect(master);
  osc.start(at);
  osc.stop(at + 0.3);
}

function startCrackle() {
  if (!ctx || !master) return;
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.0015 ? 0.5 : 0.012);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;
  const gain = ctx.createGain();
  gain.gain.value = 0.5;
  source.connect(filter).connect(gain).connect(master);
  source.start();
}

function playHat(at: number) {
  if (!ctx || !master) return;
  const seconds = 0.05;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + seconds);
  src.connect(filter).connect(gain).connect(master);
  src.start(at);
}

export function startLofi(party = false) {
  stopLofi();
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.5;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = party ? 3600 : 2600;
  master.connect(lowpass).connect(ctx.destination);

  startCrackle();

  const BAR = party ? 2.2 : 3.2; // seconds per chord
  let step = 0;
  const scheduleBar = () => {
    if (!ctx) return;
    const at = ctx.currentTime + 0.05;
    playChord(CHORDS[step % CHORDS.length], at, BAR + 0.4);
    playKick(at);
    playKick(at + BAR / 2);
    if (party) {
      playHat(at + BAR / 4);
      playHat(at + (BAR * 3) / 4);
    }
    step++;
  };
  scheduleBar();
  timers.push(setInterval(scheduleBar, BAR * 1000));
}

export function stopLofi() {
  timers.forEach(clearInterval);
  timers = [];
  void ctx?.close();
  ctx = null;
  master = null;
}
