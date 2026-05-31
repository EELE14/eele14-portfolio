/* Copyright (c) 2026 eele14. All Rights Reserved. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

export interface MediaViewerProps {
  url: string;
  filename: string;
}

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".tiff",
  ".tif",
  ".avif",
]);

const PDF_EXTENSIONS = new Set([".pdf"]);

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg", ".mov"]);

type MediaType = "image" | "pdf" | "video" | "unsupported";

function detectType(filename: string): MediaType {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (PDF_EXTENSIONS.has(ext)) return "pdf";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  return "unsupported";
}

export default function MediaViewer({ url, filename }: MediaViewerProps) {
  const type = detectType(filename);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = 0.5;
    void v.play().catch(() => {
      /* blocked by browser autoplay policy */
    });
    return () => {
      v.pause();
      v.src = "";
      v.load();
    };
  }, []);

  const container: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#1a1a1a",
    overflow: "hidden",
  };

  const toolbar: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    borderBottom: "2px solid var(--color-ink)",
    background: "var(--bg-window)",
    flexShrink: 0,
  };

  const btnStyle: React.CSSProperties = {
    height: "24px",
    padding: "0 10px",
    background: "none",
    border: "1px solid var(--color-ink)",
    cursor: "pointer",
    fontFamily: "var(--font-system)",
    fontSize: "15px",
    color: "var(--color-ink)",
  };

  return (
    <div style={container}>
      {/* Toolbar */}
      <div style={toolbar}>
        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            color: "var(--color-ink)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename}
        </span>

        {type === "image" && !imgError && (
          <>
            <button
              style={btnStyle}
              onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
            >
              +
            </button>
            <span
              style={{
                fontFamily: "var(--font-system)",
                fontSize: "14px",
                color: "var(--color-ink)",
                minWidth: "42px",
                textAlign: "center",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              style={btnStyle}
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
            >
              −
            </button>
            <button style={btnStyle} onClick={() => setZoom(1)}>
              1:1
            </button>
          </>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...btnStyle,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          ↗ Raw
        </a>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          alignItems: type === "image" ? "flex-start" : "stretch",
          justifyContent: "center",
        }}
      >
        {type === "image" && !imgError && (
          <div style={{ padding: "16px" }}>
            <img
              src={url}
              alt={filename}
              onError={() => setImgError(true)}
              style={{
                display: "block",
                maxWidth: zoom === 1 ? "100%" : "none",
                width: zoom === 1 ? "auto" : undefined,
                transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                transformOrigin: zoom !== 1 ? "top left" : undefined,
                imageRendering: zoom > 1 ? "pixelated" : "auto",
              }}
            />
          </div>
        )}

        {type === "image" && imgError && (
          <Unsupported
            filename={filename}
            url={url}
            reason="Image failed to load — it may require authentication."
          />
        )}

        {type === "pdf" && (
          <iframe
            src={url}
            title={filename}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        )}

        {type === "video" && (
          <video
            ref={videoRef}
            src={url}
            controls
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              background: "#000",
            }}
          />
        )}

        {type === "unsupported" && (
          <Unsupported filename={filename} url={url} />
        )}
      </div>
    </div>
  );
}

function Unsupported({
  filename,
  url,
  reason,
}: {
  filename: string;
  url: string;
  reason?: string;
}) {
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toUpperCase()
    : "UNKNOWN";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "12px",
        padding: "32px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-system)",
          fontSize: "48px",
          color: "var(--color-muted)",
        }}
      >
        {ext}
      </div>
      <div
        style={{
          fontFamily: "var(--font-system)",
          fontSize: "18px",
          color: "var(--color-ink)",
        }}
      >
        {reason ?? "No preview available for this file type."}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "var(--font-system)",
          fontSize: "16px",
          color: "var(--color-teal)",
          textDecoration: "underline",
        }}
      >
        Open on GitHub ↗
      </a>
    </div>
  );
}
