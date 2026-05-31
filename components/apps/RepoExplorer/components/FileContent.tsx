/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { btnBase } from "@/components/ui/ToolbarRow";
import type { FileView } from "../types";

interface FileContentProps {
  view: FileView;
  isLoading: boolean;
  onBack: () => void;
}

export default function FileContent({
  view,
  isLoading,
  onBack,
}: FileContentProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <button
          onClick={onBack}
          style={btnBase(true)}
          aria-label="Back to folder"
        >
          ← Back
        </button>
        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            color: "var(--color-ink)",
          }}
        >
          {view.name}
        </span>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: "16px",
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            color: "var(--color-muted)",
          }}
        >
          Loading…
        </div>
      ) : (
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
            userSelect: "text",
          }}
        >
          {view.content}
        </pre>
      )}
    </div>
  );
}
