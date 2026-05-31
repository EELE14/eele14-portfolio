/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ReactNode, CSSProperties } from "react";

export const btnBase = (active: boolean): CSSProperties => ({
  height: "24px",
  padding: "0 8px",
  background: "none",
  border: `1px solid ${active ? "var(--color-ink)" : "transparent"}`,
  cursor: active ? "pointer" : "default",
  fontFamily: "var(--font-system)",
  fontSize: "16px",
  color: active ? "var(--color-ink)" : "var(--color-muted)",
});

interface ToolbarRowProps {
  children: ReactNode;
  borderWidth?: 1 | 2;
  gap?: CSSProperties["gap"];
  padding?: CSSProperties["padding"];
  style?: CSSProperties;
}

export default function ToolbarRow({
  children,
  borderWidth = 1,
  gap = "4px",
  padding = "4px 6px",
  style,
}: ToolbarRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        padding,
        borderBottom: `${borderWidth}px solid var(--color-ink)`,
        background: "var(--bg-window)",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
