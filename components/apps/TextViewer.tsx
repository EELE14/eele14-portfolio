/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useState } from "react";
import { useDesktopStore } from "@/store/windowStore";

interface TextViewerProps {
  filename: string;
  url: string;
}

export default function TextViewer({ filename, url }: TextViewerProps) {
  const showContextMenu = useDesktopStore((s) => s.showContextMenu);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const lineCount = content?.split("\n").length ?? 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 8px",
          borderBottom: "2px solid var(--color-ink)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            flex: 1,
            color: "var(--color-ink)",
          }}
        >
          {filename}
        </span>
        {content !== null && (
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              background: "none",
              border: "1px solid var(--color-ink)",
              padding: "1px 8px",
              cursor: "pointer",
              color: "var(--color-ink)",
            }}
          >
            Copy
          </button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "14px",
            border: "1px solid var(--color-ink)",
            padding: "1px 8px",
            color: "var(--color-ink)",
            textDecoration: "none",
          }}
        >
          Raw
        </a>
      </div>

      {/* Content */}
      <div
        style={{ flex: 1, overflow: "auto", position: "relative" }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          showContextMenu(e.clientX, e.clientY, [
            {
              label: "Copy text",
              onClick: () => void navigator.clipboard.writeText(content ?? ""),
              disabled: content === null,
            },
            { label: "Print", onClick: () => window.print() },
          ]);
        }}
      >
        {error ? (
          <div
            style={{
              padding: "24px",
              fontFamily: "var(--font-system)",
              fontSize: "16px",
              color: "var(--color-accent)",
            }}
          >
            Error loading file: {error}
          </div>
        ) : content === null ? (
          <div
            style={{
              padding: "24px",
              fontFamily: "var(--font-system)",
              fontSize: "18px",
              color: "var(--color-muted)",
            }}
          >
            LOADING...
          </div>
        ) : (
          <div style={{ display: "flex", minHeight: "100%" }}>
            {/* Line numbers */}
            <div
              style={{
                flexShrink: 0,
                padding: "12px 8px",
                borderRight: "1px solid var(--color-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--color-muted)",
                textAlign: "right",
                userSelect: "none",
                background: "var(--bg-window)",
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code */}
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: "12px 16px",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--color-ink)",
                whiteSpace: "pre",
                overflowX: "auto",
              }}
            >
              {content}
            </pre>
          </div>
        )}
      </div>

      {/* Status bar */}
      {content !== null && (
        <div
          style={{
            padding: "2px 8px",
            borderTop: "1px solid var(--color-ink)",
            fontFamily: "var(--font-system)",
            fontSize: "14px",
            color: "var(--color-muted)",
            flexShrink: 0,
          }}
        >
          {lineCount} line{lineCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
