/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { seededRandom } from "./random";

export function createCanvasTexture(
  width: number,
  height: number,
  draw?: (ctx: CanvasRenderingContext2D) => void,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw?.(canvas.getContext("2d")!);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const FLOOR_SIZE = 512;
const PLANKS_PER_TILE = 4;

export function createFloorTexture(repeat: number): CanvasTexture {
  const plank = FLOOR_SIZE / PLANKS_PER_TILE;
  const texture = createCanvasTexture(FLOOR_SIZE, FLOOR_SIZE, (ctx) => {
    for (let row = 0; row < PLANKS_PER_TILE; row++) {
      const top = row * plank;
      const shade = 246 + Math.round(seededRandom(row, 3) * 9);
      ctx.fillStyle = `rgb(${shade}, ${shade - 3}, ${shade - 8})`;
      ctx.fillRect(0, top, FLOOR_SIZE, plank);

      for (let g = 0; g < 26; g++) {
        const y = top + seededRandom(row * 31 + g, 7) * plank;
        ctx.strokeStyle = `rgba(120, 90, 60, ${0.03 + seededRandom(g, 11) * 0.04})`;
        ctx.lineWidth = 0.6 + seededRandom(g, 13);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(FLOOR_SIZE, y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(90, 65, 40, 0.16)";
      ctx.fillRect(0, top, FLOOR_SIZE, 1.5);
      ctx.fillRect(seededRandom(row, 17) * FLOOR_SIZE, top, 1.5, plank);
    }
  });

  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);

  texture.anisotropy = 8;
  return texture;
}
