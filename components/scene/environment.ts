/* Copyright (c) 2026 eele14. All Rights Reserved. */
import {
  EquirectangularReflectionMapping,
  PMREMGenerator,
  type Texture,
  type WebGLRenderer,
} from "three";
import { createCanvasTexture } from "./textures";

const STOPS: [offset: number, color: string][] = [
  [0, "#a8c4e4"],
  [0.5, "#e0d6c2"],
  [1, "#a8845c"],
];

const HEIGHT = 64;
const WIDTH = HEIGHT * 2;

export function createEnvironmentTexture(gl: WebGLRenderer): Texture {
  const source = createCanvasTexture(WIDTH, HEIGHT, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    for (const [offset, color] of STOPS) gradient.addColorStop(offset, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  });
  source.mapping = EquirectangularReflectionMapping;

  const pmrem = new PMREMGenerator(gl);
  const target = pmrem.fromEquirectangular(source);
  pmrem.dispose();
  source.dispose();

  return target.texture;
}
