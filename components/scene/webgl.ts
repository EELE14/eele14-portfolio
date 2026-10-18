/* Copyright (c) 2026 eele14. All Rights Reserved. */

let support: boolean | undefined;

export function hasWebGL2(): boolean {
  if (support !== undefined) return support;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    support = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    support = false;
  }
  return support;
}
