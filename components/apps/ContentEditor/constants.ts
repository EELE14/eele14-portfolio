/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { CSSProperties } from "react";

export const fieldStyle: CSSProperties = {
  width: "100%",
  border: "2px solid var(--color-ink)",
  padding: "4px 8px",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
  color: "var(--color-ink)",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontFamily: "var(--font-system)",
  fontSize: "15px",
  color: "var(--color-ink)",
  marginBottom: "3px",
};

export const btnPrimary: CSSProperties = {
  padding: "3px 14px",
  background: "var(--color-accent)",
  border: "2px solid var(--color-ink)",
  boxShadow: "2px 2px 0 var(--color-ink)",
  fontFamily: "var(--font-system)",
  fontSize: "15px",
  color: "white",
  cursor: "pointer",
};

export const btnSecondary: CSSProperties = {
  padding: "3px 14px",
  background: "var(--bg-window)",
  border: "2px solid var(--color-ink)",
  boxShadow: "2px 2px 0 var(--color-ink)",
  fontFamily: "var(--font-system)",
  fontSize: "15px",
  color: "var(--color-ink)",
  cursor: "pointer",
};
