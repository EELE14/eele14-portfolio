/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  "PORTFOLIO SYSTEMS v1.0.0",
  "Copyright (C) 2026 eele14 — All Rights Reserved",
  "",
  "CPU: TypeScript 5.x @ Strict Mode  ...... OK",
  "RAM: 16384 MB DDR4                 ...... OK",
  "GPU: TailwindCSS v4 Renderer       ...... OK",
  "",
  "Detecting hardware...",
  "  Node.js v22.x LTS                ...... DETECTED",
  "  PostgreSQL 16                    ...... CONNECTED",
  "  Cloudflare R2                    ...... INITIALIZED",
  "  Next.js 15 (App Router)          ...... LOADED",
  "  Zustand State Engine             ...... READY",
  "",
  "Loading PORTFOLIO.EXE...",
  "  Mounting filesystem              ...... OK",
  "  Initializing desktop             ...... OK",
  "",
  "System ready.",
] as const;

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [shownLines, setShownLines] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [exiting, setExiting] = useState(false);
  const lineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exitedRef = useRef(false);

  const doExit = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    setExiting(true);
  };

  useEffect(() => {
    lineTimerRef.current = setInterval(() => {
      setShownLines((n) => {
        if (n >= BOOT_LINES.length) {
          clearInterval(lineTimerRef.current!);
          return n;
        }
        return n + 1;
      });
    }, 80);

    const skipTimer = setTimeout(() => setCanSkip(true), 2000);

    return () => {
      clearInterval(lineTimerRef.current!);
      clearTimeout(skipTimer);
    };
  }, []);

  useEffect(() => {
    if (canSkip && shownLines >= BOOT_LINES.length) {
      const t = setTimeout(doExit, 400);
      return () => clearTimeout(t);
    }
  }, [canSkip, shownLines]);

  useEffect(() => {
    if (!canSkip) return;
    const handler = () => doExit();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canSkip]);
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exiting && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={canSkip ? doExit : undefined}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#0a0a0a",
            color: "#33ff33",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: 1.7,
            padding: "48px 64px",
            cursor: canSkip ? "pointer" : "default",
            overflowY: "auto",
          }}
          role="status"
          aria-live="polite"
          aria-label="System boot sequence"
        >
          {BOOT_LINES.slice(0, shownLines).map((line, i) => (
            <div
              key={i}
              style={{
                whiteSpace: "pre",
                minHeight: "1.7em",
              }}
            >
              {line || " "}
            </div>
          ))}

          {shownLines < BOOT_LINES.length && (
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "9px",
                height: "16px",
                background: "#33ff33",
                marginLeft: "2px",
                verticalAlign: "text-bottom",
                animation: "bootblink 1s step-end infinite",
              }}
            />
          )}

          {canSkip && (
            <div
              style={{
                marginTop: "32px",
                color: "#555",
                fontSize: "13px",
                animation: "bootblink 1.2s step-end infinite",
              }}
            >
              Press any key or click to continue...
            </div>
          )}

          <style>{`
            @keyframes bootblink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
