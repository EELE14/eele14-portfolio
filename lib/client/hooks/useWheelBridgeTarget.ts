/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef } from "react";
import {
  isWheelBridgeMessage,
  type WheelBridgeMessage,
} from "@/lib/shared/wheel-bridge";

function canScroll(el: Element, deltaX: number, deltaY: number): boolean {
  const style = getComputedStyle(el);
  const scrollableY =
    el.scrollHeight > el.clientHeight &&
    /auto|scroll|overlay/.test(style.overflowY);
  const scrollableX =
    el.scrollWidth > el.clientWidth &&
    /auto|scroll|overlay/.test(style.overflowX);

  if (scrollableY && deltaY !== 0) {
    const room =
      deltaY > 0
        ? el.scrollHeight - el.clientHeight - Math.ceil(el.scrollTop)
        : Math.floor(el.scrollTop);
    if (room > 0) return true;
  }
  if (scrollableX && deltaX !== 0) {
    const room =
      deltaX > 0
        ? el.scrollWidth - el.clientWidth - Math.ceil(el.scrollLeft)
        : Math.floor(el.scrollLeft);
    if (room > 0) return true;
  }
  return false;
}

function scrollTargetAt(
  x: number,
  y: number,
  deltaX: number,
  deltaY: number,
): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el) {
    if (canScroll(el, deltaX, deltaY)) return el;
    el = el.parentElement;
  }
  return null;
}

export function useWheelBridgeTarget() {
  const cursor = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY };
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!isWheelBridgeMessage(e.data)) return;
      const { deltaX, deltaY } = e.data as WheelBridgeMessage;
      const at = cursor.current;
      if (!at) return;

      const target = scrollTargetAt(at.x, at.y, deltaX, deltaY);
      target?.scrollBy({ left: deltaX, top: deltaY, behavior: "instant" });
    };

    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("message", onMessage);
    };
  }, []);
}
