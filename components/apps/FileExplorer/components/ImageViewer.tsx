/* Copyright (c) 2026 eele14. All Rights Reserved. */
import Image from "next/image";
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
          border: "1px solid var(--color-ink)",
          background: "white",
          overflow: "hidden",
          padding: "8px",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Image
            src={url}
            alt={name}
            fill
            sizes="100vw"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
}
