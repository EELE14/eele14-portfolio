/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { formatHour } from "../clock";

export const PICTURE = { W: 256, H: 212 };
export const INSET = 9;
const CORNER = 26;

const { W, H } = PICTURE;

export function paintScreen(
  ctx: CanvasRenderingContext2D,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  ctx.fillStyle = "#11150f";
  ctx.fillRect(0, 0, W + INSET * 2, H + INSET * 2);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(INSET, INSET, W, H, CORNER);
  ctx.clip();
  ctx.translate(INSET, INSET);
  draw(ctx);
  ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const vignette = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.35,
    W / 2,
    H / 2,
    W * 0.62,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawOff(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#141a17";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
  ctx.beginPath();
  ctx.moveTo(W * 0.1, 0);
  ctx.lineTo(W * 0.35, 0);
  ctx.lineTo(W * 0.15, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
}

export function drawNoise(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const v = Math.floor(Math.random() * 210) + 20;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }
}

export function drawTestCard(ctx: CanvasRenderingContext2D, hour: number) {
  const bars = [
    "#c0c0c0",
    "#c0c000",
    "#00c0c0",
    "#00c000",
    "#c000c0",
    "#c00000",
    "#0000c0",
  ];
  const barW = W / bars.length;
  bars.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * barW, 0, barW + 1, H * 0.66);
  });
  bars.forEach((_, i) => {
    ctx.fillStyle = bars[bars.length - 1 - i];
    ctx.fillRect(i * barW, H * 0.66, barW + 1, H * 0.1);
  });
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, H * 0.76, W, H * 0.24);
  ctx.fillStyle = "#e8e8e8";
  ctx.textAlign = "center";
  ctx.font = "22px 'Courier New', monospace";
  ctx.fillText(formatHour(hour), W / 2, H * 0.93);
}

export function drawVisualizer(
  ctx: CanvasRenderingContext2D,
  t: number,
  playing: boolean,
) {
  ctx.fillStyle = "#0a0f0c";
  ctx.fillRect(0, 0, W, H);
  const n = 14;
  const gap = 5;
  const barW = (W - 24 - gap * (n - 1)) / n;
  const beat = playing ? 0.6 + 0.4 * Math.sin(t * Math.PI * 2 * 2.2) : 0;
  for (let i = 0; i < n; i++) {
    const wave = playing
      ? 0.25 + 0.75 * Math.abs(Math.sin(t * 1.7 + i * 0.9))
      : 0.08;
    const h = wave * (0.55 + 0.45 * beat) * (H - 60) + 8;
    const x = 12 + i * (barW + gap);
    ctx.fillStyle = "#7de8c3";
    ctx.fillRect(x, H - 24 - h, barW, h);
    ctx.fillStyle = "#d8fff0";
    ctx.fillRect(x, H - 24 - h, barW, 3);
  }
  ctx.fillStyle = "#3f6b5b";
  ctx.textAlign = "center";
  ctx.font = "13px 'Courier New', monospace";
  ctx.fillText(playing ? "~ lofi fm ~" : "~ lofi fm · paused ~", W / 2, H - 8);
}
