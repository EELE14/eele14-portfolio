/* Copyright (c) 2026 eele14. All Rights Reserved. */

export function FolderSm() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="5"
        width="18"
        height="13"
        rx="1"
        fill="var(--color-yellow)"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
      />
      <path
        d="M1 7V5a1 1 0 0 1 1-1h5l2 2H1z"
        fill="var(--color-yellow)"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FileSm() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="1"
        width="12"
        height="18"
        rx="1"
        fill="var(--bg-window)"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
      />
      <line
        x1="6"
        y1="6"
        x2="14"
        y2="6"
        stroke="var(--color-ink)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="9"
        x2="14"
        y2="9"
        stroke="var(--color-ink)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="12"
        x2="10"
        y2="12"
        stroke="var(--color-ink)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BinarySm() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="1"
        width="12"
        height="18"
        rx="1"
        fill="var(--color-muted)"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
      />
      <text
        x="10"
        y="13"
        textAnchor="middle"
        fontSize="7"
        fill="var(--color-ink)"
        fontFamily="monospace"
      >
        BIN
      </text>
    </svg>
  );
}

export function LinkSm() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="1"
        width="12"
        height="18"
        rx="1"
        fill="var(--bg-window)"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
      />
      <path
        d="M7 10h2m1 0h2M10 7v2m0 1v2"
        stroke="var(--color-teal)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
