/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef } from "react";
import { seededRandom } from "@/components/scene/random";

const CELL = 11;
const TILT = -0.36;
const BAND_EVERY = 17;
const BAND_ROWS = 2;
const MOTIF_COUNT = 46;
const INK = "rgba(6, 78, 158, 0.32)";

const MOTIFS = [
  [
    "111111111111",
    "101010101011",
    "111111111111",
    "100000000001",
    "100000000001",
    "100000000001",
    "100000000001",
    "100000000001",
    "111111111111",
  ],
  [
    "10000000",
    "11000000",
    "11100000",
    "11110000",
    "11111000",
    "11111100",
    "11111110",
    "11111000",
    "10011000",
    "00001100",
    "00001100",
  ],
  [
    "000000110000",
    "000000111000",
    "110000111100",
    "111111111111",
    "111111111111",
    "110000111100",
    "000000111000",
    "000000110000",
  ],
  [
    "0111001110",
    "1111111111",
    "1111111111",
    "1111111111",
    "0111111110",
    "0011111100",
    "0001111000",
    "0000110000",
  ],
];

function drawBands(ctx: CanvasRenderingContext2D, cells: number) {
  for (let row = -cells; row < cells; row++) {
    if ((row + cells) % BAND_EVERY >= BAND_ROWS) continue;
    for (let col = -cells; col < cells; col++) {
      if ((row + col) & 1) ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
  }
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  motif: string[],
  col: number,
  row: number,
  scale: number,
) {
  const size = CELL * scale;
  motif.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      if (line[x] !== "1") continue;
      ctx.fillRect(
        (col + x * scale) * CELL,
        (row + y * scale) * CELL,
        size,
        size,
      );
    }
  });
}

function paint(canvas: HTMLCanvasElement) {
  const { clientWidth: width, clientHeight: height } = canvas;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(ratio, ratio);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#86d9ff");
  sky.addColorStop(1, "#1c8de0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.translate(width / 2, height / 2);
  ctx.rotate(TILT);
  ctx.fillStyle = INK;
  const cells = Math.ceil(Math.hypot(width, height) / 2 / CELL);
  drawBands(ctx, cells);
  for (let i = 0; i < MOTIF_COUNT; i++) {
    const col = Math.round((seededRandom(i, 1) * 2 - 1) * cells);
    const row = Math.round((seededRandom(i, 2) * 2 - 1) * cells);
    const scale = 1 + Math.floor(seededRandom(i, 3) * 3);
    drawMotif(ctx, MOTIFS[i % MOTIFS.length], col, row, scale);
  }
}

export default function Wallpaper() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const repaint = () => paint(canvas);
    repaint();
    window.addEventListener("resize", repaint);
    return () => window.removeEventListener("resize", repaint);
  }, []);

  return <canvas ref={ref} className="glass-wallpaper" aria-hidden="true" />;
}
