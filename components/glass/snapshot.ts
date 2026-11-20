/* Copyright (c) 2026 eele14. All Rights Reserved. */

const INHERITED = [
  "color",
  "direction",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "text-align",
  "text-transform",
  "word-spacing",
];

export interface Snapshot {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

let cachedCss = { sheets: -1, text: "" };

function pageCss(): string {
  const sheets = [...document.styleSheets];
  if (cachedCss.sheets === sheets.length) return cachedCss.text;
  const text = sheets
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");
  cachedCss = { sheets: sheets.length, text };
  return text;
}

function inheritedStyle(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return "";
  const style = getComputedStyle(parent);
  return INHERITED.map(
    (name) => `${name}:${style.getPropertyValue(name)}`,
  ).join(";");
}

function blankCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
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

function rasterised(
  original: HTMLCanvasElement | HTMLImageElement,
  clone: HTMLElement,
) {
  const width =
    original instanceof HTMLCanvasElement
      ? original.width
      : original.naturalWidth;
  const height =
    original instanceof HTMLCanvasElement
      ? original.height
      : original.naturalHeight;
  const url = width && height ? dataUrlOf(original, width, height) : null;
  if (!url) return null;
  const image = document.createElement("img");
  image.src = url;
  image.className = original.className;
  image.style.cssText = clone.style.cssText;
  image.style.width ||= `${original.offsetWidth}px`;
  image.style.height ||= `${original.offsetHeight}px`;
  return image;
}

function clips(style: CSSStyleDeclaration): boolean {
  return [style.overflowX, style.overflowY].some(
    (value) => value === "hidden" || value === "clip",
  );
}

function moveClipToChildren(original: Element, clone: HTMLElement) {
  const style = getComputedStyle(original);
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

function freezeState(original: Element, clone: HTMLElement) {
  if (original instanceof HTMLInputElement) {
    clone.setAttribute("value", original.value);
    if (original.checked) clone.setAttribute("checked", "");
  }
  if (original instanceof HTMLTextAreaElement)
    clone.textContent = original.value;
  moveClipToChildren(original, clone);
  if (original.scrollTop || original.scrollLeft) {
    for (const child of clone.children) {
      (child as HTMLElement).style.translate =
        `${-original.scrollLeft}px ${-original.scrollTop}px`;
    }
  }
  if (
    original instanceof HTMLCanvasElement ||
    original instanceof HTMLImageElement
  ) {
    const image = rasterised(original, clone);
    clone.replaceWith(image ?? placeholder(original, clone));
  }
  if (
    original instanceof HTMLIFrameElement ||
    original instanceof HTMLVideoElement
  ) {
    clone.replaceWith(placeholder(original, clone));
  }
}

function frozenClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  const originals = [element, ...element.querySelectorAll("*")];
  const clones = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  originals.forEach((original, i) => freezeState(original, clones[i]));
  return clone;
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

export async function snapshot(
  element: HTMLElement,
  scale: number,
  margin: number,
): Promise<Snapshot | null> {
  const box = element.getBoundingClientRect();
  const width = Math.ceil(box.width + margin * 2);
  const height = Math.ceil(box.height + margin * 2);
  const clone = frozenClone(element);
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

  const wrapper = document.createElement("div");
  const css = document.createElement("style");
  css.textContent = pageCss();
  wrapper.append(css, clone);
  wrapper.setAttribute(
    "style",
    `position:relative;width:${width}px;height:${height}px;${inheritedStyle(element)}`,
  );
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="${width}" height="${height}">` +
    `${new XMLSerializer().serializeToString(wrapper)}</foreignObject></svg>`;

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  try {
    await image.decode();
  } catch {
    return null;
  }
  const canvas =
    (await bitmapCanvas(image, width * scale, height * scale)) ??
    scaledCanvas(image, width * scale, height * scale);
  return { canvas, width, height };
}
