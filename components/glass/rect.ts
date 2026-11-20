/* Copyright (c) 2026 eele14. All Rights Reserved. */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function relativeRect(element: Element, origin: DOMRect): Rect {
  const box = element.getBoundingClientRect();
  return {
    x: box.left - origin.left,
    y: box.top - origin.top,
    width: box.width,
    height: box.height,
  };
}

export function grown(rect: Rect, by: number): Rect {
  return {
    x: rect.x - by,
    y: rect.y - by,
    width: rect.width + by * 2,
    height: rect.height + by * 2,
  };
}

export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}
