/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { CSSProperties } from "react";

interface LoadingStateProps {
  message?: string;
  style?: CSSProperties;
}

export default function LoadingState({
  message = "Loading...",
  style,
}: LoadingStateProps) {
  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "var(--font-system)",
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
