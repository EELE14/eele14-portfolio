/* Copyright (c) 2026 eele14. All Rights Reserved. */
/* eslint-disable @next/next/no-img-element */
import { btnBase } from "@/components/ui/ToolbarRow";

interface ImageViewerProps {
  name: string;
  url: string;
  onBack: () => void;
}

export default function ImageViewer({ name, url, onBack }: ImageViewerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <button
        onClick={onBack}
        style={{
          ...btnBase(true),
          border: "1px solid var(--color-ink)",
          marginBottom: "8px",
          alignSelf: "flex-start",
        }}
        aria-label="Back to folder"
      >
        ← Back
      </button>
      <div
        style={{
          fontFamily: "var(--font-system)",
          fontSize: "15px",
          marginBottom: "6px",
        }}
      >
        {name}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--color-ink)",
          background: "white",
          overflow: "hidden",
          padding: "8px",
        }}
      >
        <img
          src={url}
          alt={name}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
