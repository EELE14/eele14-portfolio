/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { Color } from "three";

export interface LightingState {
  ambientColor: Color;
  ambientIntensity: number;
  sunColor: Color;
  sunIntensity: number;
  sunPosition: [number, number, number];
  lampIntensity: number;
}

interface Keyframe {
  hour: number;
  ambient: [color: string, intensity: number];
  sun: [color: string, intensity: number, position: [number, number, number]];
  lamp: number;
}

const KEYFRAMES: Keyframe[] = [
  {
    hour: 0,
    ambient: ["#46506a", 0.4],
    sun: ["#6f7fa8", 0.35, [-6, 14, 8]],
    lamp: 3.4,
  },
  {
    hour: 5,
    ambient: ["#565a72", 0.45],
    sun: ["#8a7f98", 0.5, [-13, 6, 9]],
    lamp: 3.0,
  },
  {
    hour: 7.5,
    ambient: ["#ffe0c4", 0.6],
    sun: ["#ffb37a", 1.4, [-14, 8, 9]],
    lamp: 1.4,
  },
  {
    hour: 12,
    ambient: ["#fff6e8", 0.8],
    sun: ["#fff2dd", 1.9, [4, 18, 8]],
    lamp: 0.6,
  },
  {
    hour: 16,
    ambient: ["#fff0da", 0.75],
    sun: ["#ffe3b8", 1.7, [10, 13, 7]],
    lamp: 0.7,
  },
  {
    hour: 19,
    ambient: ["#f6d3ae", 0.6],
    sun: ["#ff9e5e", 1.3, [14, 6, 9]],
    lamp: 1.8,
  },
  {
    hour: 21.5,
    ambient: ["#6d6a80", 0.45],
    sun: ["#9a7f9d", 0.55, [12, 8, 8]],
    lamp: 3.0,
  },
  {
    hour: 24,
    ambient: ["#46506a", 0.4],
    sun: ["#6f7fa8", 0.35, [-6, 14, 8]],
    lamp: 3.4,
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function segmentAt<T extends { hour: number }>(
  frames: T[],
  hour: number,
): [T, T, number] {
  const h = ((hour % 24) + 24) % 24;
  const next = Math.max(
    frames.findIndex((k) => k.hour >= h),
    1,
  );
  const a = frames[next - 1];
  const b = frames[next];
  return [a, b, b.hour === a.hour ? 0 : (h - a.hour) / (b.hour - a.hour)];
}

export function lightingForHour(hour: number): LightingState {
  const [a, b, t] = segmentAt(KEYFRAMES, hour);

  return {
    ambientColor: new Color(a.ambient[0]).lerp(new Color(b.ambient[0]), t),
    ambientIntensity: lerp(a.ambient[1], b.ambient[1], t),
    sunColor: new Color(a.sun[0]).lerp(new Color(b.sun[0]), t),
    sunIntensity: lerp(a.sun[1], b.sun[1], t),
    sunPosition: [
      lerp(a.sun[2][0], b.sun[2][0], t),
      lerp(a.sun[2][1], b.sun[2][1], t),
      lerp(a.sun[2][2], b.sun[2][2], t),
    ],
    lampIntensity: lerp(a.lamp, b.lamp, t),
  };
}

const SKY_KEYFRAMES = [
  { hour: 0, color: "#141a30" },
  { hour: 5, color: "#232a4a" },
  { hour: 7.5, color: "#f0b47c" },
  { hour: 10, color: "#a6cbea" },
  { hour: 16, color: "#9ec7e8" },
  { hour: 19, color: "#f09a5e" },
  { hour: 21.5, color: "#28304f" },
  { hour: 24, color: "#141a30" },
];

export function skyColorForHour(hour: number): Color {
  const [a, b, t] = segmentAt(SKY_KEYFRAMES, hour);
  return new Color(a.color).lerp(new Color(b.color), t);
}

export function currentLocalHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
