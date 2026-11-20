/* Copyright (c) 2026 eele14. All Rights Reserved. */

const PROFILE_SAMPLES = 128;
const IOR = 1.5;
export const NEUTRAL = 128;

export interface LensShape {
  width: number;
  height: number;
  radius: number;
  bezel: number;
}

interface Edge {
  depth: number;
  nx: number;
  ny: number;
}

// essentially how far a ray lands from where it entered the convex squircle bezel from the outer edge
// (index 0) to the flat center, normalized peak 1
function bezelProfile(): Float32Array {
  const profile = new Float32Array(PROFILE_SAMPLES);
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const inward = 1 - (i + 0.5) / PROFILE_SAMPLES;
    const solid = 1 - inward ** 4;
    const height = solid ** 0.25;
    const incidence = Math.atan(inward ** 3 / solid ** 0.75);
    const refracted = Math.asin(Math.sin(incidence) / IOR);
    profile[i] = height * Math.tan(incidence - refracted);
  }
  const peak = Math.max(...profile);
  return profile.map((shift) => shift / peak);
}

function nearestEdge(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
  radius: number,
): Edge {
  const qx = Math.abs(px) - halfW;
  const qy = Math.abs(py) - halfH;
  if (qx > 0 && qy > 0) {
    const reach = Math.hypot(qx, qy);
    return {
      depth: radius - reach,
      nx: (-Math.sign(px) * qx) / reach,
      ny: (-Math.sign(py) * qy) / reach,
    };
  }
  if (qx > qy) return { depth: radius - qx, nx: -Math.sign(px), ny: 0 };
  return { depth: radius - qy, nx: 0, ny: -Math.sign(py) };
}

export function displacementImage(shape: LensShape): ImageData | null {
  const { width, height } = shape;
  const radius = Math.min(shape.radius, width / 2, height / 2);
  const rim = Math.min(shape.bezel, radius);
  if (rim <= 0) return null;

  const image = new ImageData(width, height);
  const profile = bezelProfile();
  const halfW = width / 2 - radius;
  const halfH = height / 2 - radius;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edge = nearestEdge(
        x + 0.5 - width / 2,
        y + 0.5 - height / 2,
        halfW,
        halfH,
        radius,
      );
      const onRim = edge.depth >= 0 && edge.depth < rim;
      const shift = onRim
        ? profile[Math.floor((edge.depth / rim) * PROFILE_SAMPLES)]
        : 0;
      const i = (y * width + x) * 4;
      image.data[i] = NEUTRAL + edge.nx * shift * 127;
      image.data[i + 1] = NEUTRAL + edge.ny * shift * 127;
      image.data[i + 2] = NEUTRAL;
      image.data[i + 3] = 255;
    }
  }

  return image;
}

export function imageDataUrl(image: ImageData): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}
