/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ReactNode } from "react";

export default function NavButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="btn"
      style={{
        width: 32,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-window)",
        border: "2px solid var(--color-ink)",
        boxShadow: "2px 2px 0 var(--color-ink)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        color: "var(--color-ink)",
        flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}
