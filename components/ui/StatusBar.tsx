/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ReactNode, CSSProperties } from "react";

interface StatusBarProps {
  children: ReactNode;
  font?: "system" | "body";
  style?: CSSProperties;
}

export default function StatusBar({
  children,
  font = "system",
  style,
}: StatusBarProps) {
  return (
    <div
      style={{
        padding: "2px 8px",
        borderTop: "1px solid var(--color-ink)",
        fontFamily: font === "body" ? "var(--font-body)" : "var(--font-system)",
        fontSize: "13px",
        color: "var(--color-muted)",
        flexShrink: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
