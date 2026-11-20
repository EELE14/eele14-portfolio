/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { documentCss, inheritedStyle, styleOf } from "./css";
import { frozenClone, type FrameImages } from "./freeze";
import { rasterise, svgImageUrl } from "./raster";

export interface Snapshot {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const TRANSPARENT = "rgba(0, 0, 0, 0)";

function viewportBackground(doc: Document): string {
  const root = styleOf(doc.documentElement).backgroundColor;
  if (root !== TRANSPARENT || !doc.body) return root;
  return styleOf(doc.body).backgroundColor;
}

function frameImage(frame: HTMLIFrameElement): string | null {
  const doc = frame.contentDocument;
  const { clientWidth: width, clientHeight: height } = frame;
  if (!doc?.documentElement || !width || !height) return null;

  const root = doc.documentElement;
  const clone = frozenClone(root, frameImages(root));
  clone.querySelector("head")?.remove();
  clone.style.width = `${width}px`;
  return svgImageUrl(
    clone,
    `position:relative;width:${width}px;height:${height}px;overflow:hidden;background:${viewportBackground(doc)}`,
    documentCss(doc),
    width,
    height,
  );
}

function frameImages(element: Element): FrameImages {
  return new Map(
    [...element.querySelectorAll("iframe")].map((frame) => [
      frame,
      frameImage(frame),
    ]),
  );
}

export async function snapshot(
  element: HTMLElement,
  scale: number,
  margin: number,
): Promise<Snapshot | null> {
  const box = element.getBoundingClientRect();
  const width = Math.ceil(box.width + margin * 2);
  const height = Math.ceil(box.height + margin * 2);
  const clone = frozenClone(element, frameImages(element));
  Object.assign(clone.style, {
    position: "absolute",
    left: `${margin}px`,
    top: `${margin}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    transform: "none",
    translate: "none",
    margin: "0",
  });

  const url = svgImageUrl(
    clone,
    `position:relative;width:${width}px;height:${height}px;${inheritedStyle(element)}`,
    documentCss(element.ownerDocument),
    width,
    height,
  );
  const canvas = await rasterise(url, width, height, scale);
  return canvas && { canvas, width, height };
}
