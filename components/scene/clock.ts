/* Copyright (c) 2026 eele14. All Rights Reserved. */

export function currentLocalHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
