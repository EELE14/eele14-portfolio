/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { Color } from "three";
import { lerp, segmentAt } from "./keyframes";

export interface LightingState {
  ambientColor: Color;
  ambientIntensity: number;
  hemiSkyColor: Color;
  hemiBounceColor: Color;
  hemiIntensity: number;
  envIntensity: number;
  sunColor: Color;
  sunIntensity: number;
  sunPosition: [number, number, number];
  lampIntensity: number;
}

interface Keyframe {
  hour: number;
  ambient: [color: string, intensity: number];
  hemi: [sky: string, bounce: string, intensity: number];
  env: number;
  sun: [color: string, intensity: number, position: [number, number, number]];
  lamp: number;
}

const KEYFRAMES: Keyframe[] = [
  {
    hour: 0,
    ambient: ["#414a63", 0.48],
    hemi: ["#1b2033", "#2b2b38", 0.26],
    env: 0,
    sun: ["#5d6a8e", 0.28, [-6, 14, 8]],
    lamp: 3.4,
  },
  {
    hour: 5,
    ambient: ["#565a72", 0.32],
    hemi: ["#2a3358", "#46405a", 0.22],
    env: 0,
    sun: ["#8a7f98", 0.5, [-13, 6, 9]],
    lamp: 3.0,
  },
  {
    hour: 7.5,
    ambient: ["#e8dcc8", 0.2],
    hemi: ["#7f9bc4", "#e0b083", 0.58],
    env: 0.18,
    sun: ["#ffb37a", 1.4, [-14, 8, 9]],
    lamp: 2.2,
  },
  {
    hour: 12,
    ambient: ["#f2e6d4", 0.18],
    hemi: ["#a9c9ea", "#dcb488", 0.7],
    env: 0.3,
    sun: ["#fff2dd", 1.9, [4, 18, 8]],
    lamp: 1.8,
  },
  {
    hour: 16,
    ambient: ["#f0e2ce", 0.18],
    hemi: ["#a5c4e4", "#dfb88e", 0.68],
    env: 0.28,
    sun: ["#ffe3b8", 1.7, [10, 13, 7]],
    lamp: 1.8,
  },
  {
    hour: 19,
    ambient: ["#ecd8bc", 0.2],
    hemi: ["#6f86b4", "#e0a878", 0.62],
    env: 0.18,
    sun: ["#ff9e5e", 1.3, [14, 6, 9]],
    lamp: 2.6,
  },
  {
    hour: 21.5,
    ambient: ["#6d6a80", 0.32],
    hemi: ["#333c60", "#504a64", 0.24],
    env: 0,
    sun: ["#9a7f9d", 0.55, [12, 8, 8]],
    lamp: 3.0,
  },
  {
    hour: 24,
    ambient: ["#414a63", 0.48],
    hemi: ["#1b2033", "#2b2b38", 0.26],
    env: 0,
    sun: ["#5d6a8e", 0.28, [-6, 14, 8]],
    lamp: 3.4,
  },
];

export function lightingForHour(hour: number): LightingState {
  const [a, b, t] = segmentAt(KEYFRAMES, hour);

  return {
    ambientColor: new Color(a.ambient[0]).lerp(new Color(b.ambient[0]), t),
    ambientIntensity: lerp(a.ambient[1], b.ambient[1], t),
    hemiSkyColor: new Color(a.hemi[0]).lerp(new Color(b.hemi[0]), t),
    hemiBounceColor: new Color(a.hemi[1]).lerp(new Color(b.hemi[1]), t),
    hemiIntensity: lerp(a.hemi[2], b.hemi[2], t),
    envIntensity: lerp(a.env, b.env, t),
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

const DARK_SUN = 0.8;

export function isDarkHour(hour: number): boolean {
  return lightingForHour(hour).sunIntensity < DARK_SUN;
}
