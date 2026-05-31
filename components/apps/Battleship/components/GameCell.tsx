/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ReactNode } from "react";
import { CELL } from "../constants";

export default function GameCell({
  hasShip,
  hit,
  clickable,
  onClick,
  onMouseEnter,
  onMouseLeave,
  size = CELL,
}: {
  hasShip: boolean;
  hit: boolean;
  clickable?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  size?: number;
}) {
  let bg = "transparent";
  let border = "var(--color-muted)";
  let symbol: ReactNode = null;

  if (hit && hasShip) {
    bg = "var(--color-accent)";
    border = "var(--color-ink)";
    symbol = (
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        className="hit-burst"
        aria-hidden="true"
      >
        <polygon
          points="10,1 11.2,7.2 16.4,3.6 12.8,8.9 19,10 12.8,11.1 16.4,16.4 11.2,12.8 10,19 8.8,12.8 3.6,16.4 7.2,11.1 1,10 7.2,8.9 3.6,3.6 8.8,7.2"
          fill="var(--bg-window)"
        />
      </svg>
    );
  } else if (hit) {
    bg = "rgba(26,26,26,0.14)";
    border = "var(--color-muted)";
    symbol = (
      <span
        style={{
          fontSize: "18px",
          fontFamily: "var(--font-system)",
          color: "var(--color-muted)",
          lineHeight: 1,
          userSelect: "none",
          marginTop: "1px",
        }}
      >
        ·
      </span>
    );
  } else if (hasShip) {
    bg = "var(--bg-titlebar)";
    border = "var(--color-ink)";
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`game-cell${clickable ? " clickable" : ""}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: bg,
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: clickable ? "crosshair" : "default",
        flexShrink: 0,
      }}
    >
      {symbol}
    </div>
  );
}
