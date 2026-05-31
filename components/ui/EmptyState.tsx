/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { CSSProperties } from "react";

interface EmptyStateProps {
  message: string;
  font?: "system" | "body";
  style?: CSSProperties;
}

export default function EmptyState({
  message,
  font = "system",
  style,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "24px",
        fontFamily: font === "body" ? "var(--font-body)" : "var(--font-system)",
        fontSize: "16px",
        color: "var(--color-muted)",
        textAlign: "center",
        ...style,
      }}
    >
      {message}
    </div>
  );
}
