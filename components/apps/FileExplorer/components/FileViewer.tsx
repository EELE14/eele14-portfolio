/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { btnBase } from "@/components/ui/ToolbarRow";

interface FileViewerProps {
  name: string;
  content: string;
  onBack: () => void;
}

export default function FileViewer({ name, content, onBack }: FileViewerProps) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          ...btnBase(true),
          border: "1px solid var(--color-ink)",
          marginBottom: "8px",
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
      <pre
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.6,
          padding: "8px",
          background: "white",
          border: "1px solid var(--color-ink)",
          margin: 0,
        }}
      >
        {content}
      </pre>
    </div>
  );
}
