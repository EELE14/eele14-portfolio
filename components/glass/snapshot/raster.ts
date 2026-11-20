/* Copyright (c) 2026 eele14. All Rights Reserved. */

export function blankCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

let bitmapsReadable: boolean | undefined;

function isReadable(canvas: HTMLCanvasElement): boolean {
  try {
    canvas.getContext("2d")?.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

async function bitmapCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
): Promise<HTMLCanvasElement | null> {
  if (bitmapsReadable === false) return null;
  const bitmap = await createImageBitmap(image, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: "high",
  }).catch(() => null);
  if (!bitmap) {
    bitmapsReadable = false;
    return null;
  }
  const canvas = blankCanvas(width, height);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  bitmap.close();
  bitmapsReadable ??= isReadable(canvas);
  return bitmapsReadable ? canvas : null;
}

function scaledCanvas(image: HTMLImageElement, width: number, height: number) {
  const canvas = blankCanvas(width, height);
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
  return canvas;
}

export function svgImageUrl(
  content: Element,
  style: string,
  css: string,
  width: number,
  height: number,
): string {
  const wrapper = document.createElement("div");
  const sheet = document.createElement("style");
  sheet.textContent = css;
  wrapper.append(sheet, content);
  wrapper.setAttribute("style", style);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="${width}" height="${height}">` +
    `${new XMLSerializer().serializeToString(wrapper)}</foreignObject></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function rasterise(
  url: string,
  width: number,
  height: number,
  scale: number,
): Promise<HTMLCanvasElement | null> {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    return null;
  }
  return (
    (await bitmapCanvas(image, width * scale, height * scale)) ??
    scaledCanvas(image, width * scale, height * scale)
  );
}
