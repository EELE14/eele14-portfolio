/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { CSSProperties } from "react";

export const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
export const CELL = 24;

export const S = {
  wrap: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    background: "var(--bg-window)",
    fontFamily: "var(--font-system)",
    color: "var(--color-ink)",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderBottom: "2px solid var(--color-ink)",
    background: "var(--bg-window)",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflow: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  btn: (accent?: boolean, danger?: boolean): CSSProperties => ({
    fontFamily: "var(--font-system)",
    fontSize: "16px",
    padding: "3px 12px",
    background: accent
      ? "var(--color-ink)"
      : danger
        ? "var(--color-accent)"
        : "var(--bg-window)",
    color: accent
      ? "var(--bg-window)"
      : danger
        ? "var(--bg-window)"
        : "var(--color-ink)",
    border: "2px solid var(--color-ink)",
    boxShadow: "2px 2px 0 var(--color-ink)",
    cursor: "pointer",
    letterSpacing: "0.02em",
    flexShrink: 0,
  }),
  input: {
    fontFamily: "var(--font-system)",
    fontSize: "18px",
    padding: "3px 8px",
    background: "var(--bg-window)",
    color: "var(--color-ink)",
    border: "2px solid var(--color-ink)",
    outline: "none",
    textTransform: "uppercase" as const,
    flex: 1,
    minWidth: 0,
  } satisfies CSSProperties,
  label: (size?: number): CSSProperties => ({
    fontSize: `${size ?? 14}px`,
    fontFamily: "var(--font-system)",
    color: "var(--color-muted)",
    letterSpacing: "0.05em",
  }),
  status: (ok?: boolean): CSSProperties => ({
    fontSize: "15px",
    fontFamily: "var(--font-body)",
    color:
      ok == null
        ? "var(--color-muted)"
        : ok
          ? "var(--color-teal)"
          : "var(--color-accent)",
    letterSpacing: "0.02em",
    flex: 1,
  }),
  divider: {
    border: "none",
    borderTop: "1px solid var(--color-muted)",
    margin: "0",
    opacity: 0.4,
  } satisfies CSSProperties,
  code: {
    fontFamily: "var(--font-display)",
    fontSize: "32px",
    letterSpacing: "0.2em",
    border: "2px solid var(--color-ink)",
    boxShadow: "3px 3px 0 var(--color-ink)",
    padding: "8px 20px",
    background: "var(--bg-window)",
    display: "inline-block",
    color: "var(--color-ink)",
  } satisfies CSSProperties,
  gridWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1px",
    userSelect: "none" as const,
  },
  row: { display: "flex", gap: "1px" },
  headerCell: {
    width: `${CELL}px`,
    height: `${CELL}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontFamily: "var(--font-system)",
    color: "var(--color-muted)",
    flexShrink: 0,
  } satisfies CSSProperties,
  shipRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 6px",
    border: "1px solid transparent",
    cursor: "pointer",
  } satisfies CSSProperties,
  shipBar: (
    _size: number,
    _active: boolean,
    placed: boolean,
  ): CSSProperties => ({
    display: "flex",
    gap: "2px",
    opacity: placed ? 0.35 : 1,
  }),
  shipBlock: (active: boolean): CSSProperties => ({
    width: "14px",
    height: "14px",
    background: active ? "var(--color-teal)" : "var(--bg-titlebar)",
    border: "1px solid var(--color-ink)",
  }),
};
