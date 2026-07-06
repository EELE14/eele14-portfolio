/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { CanvasTexture, SRGBColorSpace } from "three";

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
