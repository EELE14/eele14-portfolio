/* Copyright (c) 2026 eele14. All Rights Reserved. */

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function segmentAt<T extends { hour: number }>(
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
