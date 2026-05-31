/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { CSSProperties } from "react";

type BannerVariant = "error" | "success" | "info";

interface StatusBannerProps {
  variant: BannerVariant;
  message: string;
  style?: CSSProperties;
}

const BG: Record<BannerVariant, string> = {
  error: "var(--color-accent)",
  success: "var(--color-teal)",
  info: "var(--bg-titlebar)",
};

export default function StatusBanner({
  variant,
  message,
  style,
}: StatusBannerProps) {
  return (
    <div
      role="alert"
      style={{
        padding: "6px 12px",
        background: BG[variant],
        color: "white",
        fontFamily: "var(--font-system)",
        fontSize: "16px",
        flexShrink: 0,
        ...style,
      }}
    >
      {message}
    </div>
  );
}
