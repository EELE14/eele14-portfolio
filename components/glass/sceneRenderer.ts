/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { NEUTRAL } from "./displacement";
import type { Rect } from "./rect";

export interface SceneLayer {
  key: string;
  source: TexImageSource;
  version: string;
  rect: Rect;
}

export interface SceneLens {
  key: string;
  map: ImageData;
  refraction: number;
  rect: Rect;
}

export interface SceneFrame {
  width: number;
  height: number;
  ratio: number;
  layers: SceneLayer[];
  lenses: SceneLens[];
}

export interface SceneRenderer {
  draw(frame: SceneFrame): void;
  dispose(): void;
}

interface Uploaded {
  texture: WebGLTexture;
  version: unknown;
}

interface Programs {
  compose: WebGLProgram;
  rim: WebGLProgram;
}

const VERTEX = `#version 300 es
uniform vec4 uRect;
uniform vec2 uViewport;
out vec2 vUv;
void main() {
  vec2 corner = vec2(gl_VertexID & 1, gl_VertexID >> 1);
  vec2 position = uRect.xy + corner * uRect.zw;
  vUv = corner;
  gl_Position = vec4(position / uViewport * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}`;

const COMPOSE = `#version 300 es
precision mediump float;
uniform sampler2D uLayer;
in vec2 vUv;
out vec4 outColor;
void main() {
  outColor = texture(uLayer, vUv);
}`;

const RIM = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMap;
uniform vec4 uRect;
uniform vec2 uViewport;
uniform float uRefraction;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 shift = (texture(uMap, vUv).rg - ${(NEUTRAL / 255).toFixed(8)}) * 2.0 * uRefraction;
  // Where nothing bends, the live DOM under the glass is already correct.
  float alpha = smoothstep(0.0, 1.0, length(shift));
  vec2 at = (uRect.xy + vUv * uRect.zw + shift) / uViewport;
  outColor = texture(uScene, vec2(at.x, 1.0 - at.y)) * alpha;
}`;

function compile(gl: WebGL2RenderingContext, type: GLenum, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext, fragment: string) {
  const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!vertexShader || !fragmentShader || !program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function emptyTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function textureCache(gl: WebGL2RenderingContext) {
  const cache = new Map<string, Uploaded>();

  return {
    use(key: string, version: unknown, upload: () => void): WebGLTexture {
      let entry = cache.get(key);
      if (!entry) {
        entry = { texture: emptyTexture(gl), version: undefined };
        cache.set(key, entry);
      }
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      if (entry.version !== version) {
        upload();
        entry.version = version;
      }
      return entry.texture;
    },
    prune(keep: Set<string>) {
      for (const [key, entry] of cache) {
        if (keep.has(key)) continue;
        gl.deleteTexture(entry.texture);
        cache.delete(key);
      }
    },
  };
}

const identities = new WeakMap<object, number>();
let nextIdentity = 0;

function identity(value: object): number {
  let id = identities.get(value);
  if (id === undefined) {
    id = ++nextIdentity;
    identities.set(value, id);
  }
  return id;
}

function setRect(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  rect: Rect,
  frame: SceneFrame,
) {
  gl.uniform4f(
    gl.getUniformLocation(program, "uRect"),
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  );
  gl.uniform2f(
    gl.getUniformLocation(program, "uViewport"),
    frame.width,
    frame.height,
  );
}

function sceneRenderer(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  programs: Programs,
): SceneRenderer {
  const layers = textureCache(gl);
  const maps = textureCache(gl);
  const scene = emptyTexture(gl);
  const target = gl.createFramebuffer();
  let sceneSize = "";
  let lastScene = "";
  let lastRims = "";

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  function resize(frame: SceneFrame) {
    const width = Math.round(frame.width * frame.ratio);
    const height = Math.round(frame.height * frame.ratio);
    const size = `${width}x${height}`;
    if (size === sceneSize) return;
    sceneSize = size;
    canvas.width = width;
    canvas.height = height;
    gl.bindTexture(gl.TEXTURE_2D, scene);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      scene,
      0,
    );
  }

  function composeScene(frame: SceneFrame) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programs.compose);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation(programs.compose, "uLayer"), 0);
    for (const layer of frame.layers) {
      layers.use(layer.key, layer.version, () =>
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          layer.source,
        ),
      );
      setRect(gl, programs.compose, layer.rect, frame);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    layers.prune(new Set(frame.layers.map((layer) => layer.key)));
  }

  function drawRims(frame: SceneFrame) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programs.rim);
    gl.uniform1i(gl.getUniformLocation(programs.rim, "uScene"), 0);
    gl.uniform1i(gl.getUniformLocation(programs.rim, "uMap"), 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene);
    gl.activeTexture(gl.TEXTURE1);
    for (const lens of frame.lenses) {
      maps.use(lens.key, lens.map, () =>
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          lens.map,
        ),
      );
      setRect(gl, programs.rim, lens.rect, frame);
      gl.uniform1f(
        gl.getUniformLocation(programs.rim, "uRefraction"),
        lens.refraction,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    maps.prune(new Set(frame.lenses.map((lens) => lens.key)));
  }

  return {
    draw(frame) {
      const scene = JSON.stringify([
        frame.width,
        frame.height,
        frame.ratio,
        frame.layers.map(({ key, version, rect }) => [key, version, rect]),
      ]);
      const rims = JSON.stringify(
        frame.lenses.map(({ key, map, refraction, rect }) => [
          key,
          identity(map),
          refraction,
          rect,
        ]),
      );
      if (scene !== lastScene) {
        resize(frame);
        composeScene(frame);
      }
      if (scene !== lastScene || rims !== lastRims) drawRims(frame);
      lastScene = scene;
      lastRims = rims;
    },
    dispose() {
      layers.prune(new Set());
      maps.prune(new Set());
      gl.deleteTexture(scene);
      gl.deleteFramebuffer(target);
      gl.deleteProgram(programs.compose);
      gl.deleteProgram(programs.rim);
    },
  };
}

export function createSceneRenderer(
  canvas: HTMLCanvasElement,
): SceneRenderer | null {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;
  const compose = link(gl, COMPOSE);
  const rim = link(gl, RIM);
  if (!compose || !rim) return null;
  return sceneRenderer(canvas, gl, { compose, rim });
}
