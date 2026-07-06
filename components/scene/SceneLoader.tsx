/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">LOADING ROOM...</div>,
});

export default function SceneLoader() {
  const rootRef = useRef<HTMLDivElement>(null);

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
      <Scene />
    </div>
  );
}
