/* Copyright (c) 2026 eele14. All Rights Reserved. */

const svgProps = {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.5",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconBack() {
  return (
    <svg {...svgProps} aria-hidden="true">
      <polyline points="15,4 7,12 15,20" />
    </svg>
  );
}

export function IconForward() {
  return (
    <svg {...svgProps} aria-hidden="true">
      <polyline points="9,4 17,12 9,20" />
    </svg>
  );
}

export function IconRefresh() {
  return (
    <svg {...svgProps} aria-hidden="true">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export function IconHome() {
  return (
    <svg {...svgProps} aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9,21 9,13 15,13 15,21" />
    </svg>
  );
}

export function IconNewTab() {
  return (
    <svg {...svgProps} width="14" height="14" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg {...svgProps} width="10" height="10" aria-hidden="true">
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}
