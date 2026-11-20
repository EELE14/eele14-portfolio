/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { styleOf } from "./css";
import { blankCanvas } from "./raster";

export type FrameImages = Map<Element, string | null>;

const REPLACED = new Set(["canvas", "img", "iframe", "video"]);

function isTag<K extends keyof HTMLElementTagNameMap>(
  element: Element,
  tag: K,
): element is HTMLElementTagNameMap[K] {
  return element.localName === tag;
}

function dataUrlOf(source: CanvasImageSource, width: number, height: number) {
  const canvas = blankCanvas(width, height);
  try {
    canvas.getContext("2d")?.drawImage(source, 0, 0);
    return canvas.toDataURL();
  } catch {
    return null;
  }
}

function placeholder(original: HTMLElement, clone: HTMLElement): HTMLElement {
  const box = document.createElement("div");
  box.style.cssText = clone.style.cssText;
  Object.assign(box.style, {
    width: `${original.offsetWidth}px`,
    height: `${original.offsetHeight}px`,
    background: "#fff",
  });
  return box;
}

function imageFrom(url: string, original: HTMLElement, clone: HTMLElement) {
  const image = document.createElement("img");

  image.decoding = "sync";
  image.src = url;
  image.className = original.className;
  image.style.cssText = clone.style.cssText;
  image.style.width ||= `${original.offsetWidth}px`;
  image.style.height ||= `${original.offsetHeight}px`;
  return image;
}

function rasterised(original: HTMLCanvasElement | HTMLImageElement) {
  const width = isTag(original, "canvas")
    ? original.width
    : original.naturalWidth;
  const height = isTag(original, "canvas")
    ? original.height
    : original.naturalHeight;
  return width && height ? dataUrlOf(original, width, height) : null;
}

function clips(style: CSSStyleDeclaration): boolean {
  return [style.overflowX, style.overflowY].some(
    (value) => value === "hidden" || value === "clip",
  );
}

function moveClipToChildren(original: Element, clone: HTMLElement) {
  const style = styleOf(original);
  if (!clips(style) || !original.children.length) return;
  const box = original.getBoundingClientRect();
  clone.style.overflow = "visible";
  [...original.children].forEach((child, i) => {
    const inner = child.getBoundingClientRect();
    const inset = [
      box.top - inner.top,
      inner.right - box.right,
      inner.bottom - box.bottom,
      box.left - inner.left,
    ];
    (clone.children[i] as HTMLElement).style.clipPath =
      `inset(${inset.map((side) => `${side}px`).join(" ")} round ${style.borderRadius})`;
  });
}

function replaced(original: Element, frames: FrameImages): string | null {
  if (isTag(original, "canvas") || isTag(original, "img"))
    return rasterised(original);
  if (isTag(original, "iframe")) return frames.get(original) ?? null;
  return null;
}

function freezeState(
  original: Element,
  clone: HTMLElement,
  frames: FrameImages,
) {
  if (isTag(original, "input")) {
    clone.setAttribute("value", original.value);
    if (original.checked) clone.setAttribute("checked", "");
  }
  if (isTag(original, "textarea")) clone.textContent = original.value;
  moveClipToChildren(original, clone);
  if (original.scrollTop || original.scrollLeft) {
    for (const child of clone.children) {
      (child as HTMLElement).style.translate =
        `${-original.scrollLeft}px ${-original.scrollTop}px`;
    }
  }
  if (!REPLACED.has(original.localName)) return;
  const element = original as HTMLElement;
  const url = replaced(original, frames);
  clone.replaceWith(
    url ? imageFrom(url, element, clone) : placeholder(element, clone),
  );
}

export function frozenClone(
  element: Element,
  frames: FrameImages,
): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  const originals = [element, ...element.querySelectorAll("*")];
  const clones = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  originals.forEach((original, i) => freezeState(original, clones[i], frames));
  return clone;
}
