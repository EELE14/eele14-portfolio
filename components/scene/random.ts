/* Copyright (c) 2026 eele14. All Rights Reserved. */
export function seededRandom(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
