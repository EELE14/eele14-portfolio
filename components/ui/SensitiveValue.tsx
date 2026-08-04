/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useState } from "react";

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <ellipse cx="7" cy="7" rx="5" ry="3.5" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
      {visible && <line x1="2" y1="2" x2="12" y2="12" strokeWidth="1.5" />}
    </svg>
  );
}

interface SensitiveValueProps {
  value: string;
  /**
   * Optional hover note. Deliberately not defaulted: the network dialog can
   * promise the value is never stored, the admin panel cannot.
   */
  note?: string;
  fontSize?: string;
}

/** Blurred until clicked, so IPs survive screenshots and screen shares. */
export default function SensitiveValue({
  value,
  note,
  fontSize = "13px",
}: SensitiveValueProps) {
  const [revealed, setRevealed] = useState(false);
  const [showTip, setShowTip] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1 }}>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize,
          color: "var(--color-ink)",
          filter: revealed ? "none" : "blur(5px)",
          userSelect: revealed ? "auto" : "none",
          transition: "filter 0.15s",
        }}
      >
        {value}
      </span>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setRevealed((v) => !v)}
          onMouseEnter={() => note && setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          aria-label={revealed ? "Hide value" : "Reveal value"}
          style={{
            display: "flex",
            alignItems: "center",
            background: "none",
            border: "1px solid var(--color-muted)",
            cursor: "pointer",
            padding: "1px 3px",
            color: "var(--color-muted)",
            lineHeight: 1,
          }}
        >
          <EyeIcon visible={revealed} />
        </button>
        {note && showTip && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 5px)",
              right: 0,
              width: "180px",
              background: "var(--bg-window)",
              border: "2px solid var(--color-ink)",
              boxShadow: "2px 2px 0 var(--color-ink)",
              padding: "5px 7px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-ink)",
              lineHeight: 1.5,
              zIndex: 9000,
              pointerEvents: "none",
            }}
          >
            {note}
          </div>
        )}
      </div>
    </div>
  );
}
