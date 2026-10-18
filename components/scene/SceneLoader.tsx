/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import WebGLFallback from "./WebGLFallback";
import { hasWebGL2 } from "./webgl";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">LOADING ROOM...</div>,
});

const noSubscription = () => () => {};

export default function SceneLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  // R3F creates the renderer in an un-awaited promise, so a missing WebGL
  // context never reaches an error boundary — it has to be caught up front.
  const webgl = useSyncExternalStore(noSubscription, hasWebGL2, () => true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const undoScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !root.contains(el)) return;
      if (el.closest(".paper-backdrop")) return;
      el.scrollTop = 0;
      el.scrollLeft = 0;
    };
    document.addEventListener("scroll", undoScroll, true);
    return () => document.removeEventListener("scroll", undoScroll, true);
  }, []);

  return (
    <div className="scene-root" ref={rootRef}>
      {webgl ? <Scene /> : <WebGLFallback />}
    </div>
  );
}
