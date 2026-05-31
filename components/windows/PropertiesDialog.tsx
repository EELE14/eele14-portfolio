/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";

export interface PropertiesDialogProps {
  name: string;
  type: string;
  size?: string;
  created?: string;
  location?: string;
  description?: string;
  onClose: () => void;
  isAdmin?: boolean;
  onSaveName?: (newName: string) => void;
}

export default function PropertiesDialog({
  name,
  type,
  size,
  created,
  location,
  description,
  onClose,
  isAdmin = false,
  onSaveName,
}: PropertiesDialogProps) {
  const [editedName, setEditedName] = useState(name);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSave() {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== name) {
      onSaveName?.(trimmed);
    }
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    border: "2px solid var(--color-ink)",
    padding: "3px 6px",
    fontFamily: "var(--font-display)",
    fontSize: "14px",
    color: "var(--color-ink)",
    background: "white",
    outline: "none",
    flex: 1,
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 11000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.25)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${name} Properties`}
        className="win-border"
        style={{
          background: "var(--bg-window)",
          width: "340px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "28px",
            background: "var(--bg-titlebar)",
            padding: "0 8px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "17px",
              color: "white",
            }}
          >
            {name} Properties
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close properties dialog"
            className="btn-dot"
            style={{
              width: "18px",
              height: "18px",
              background: "var(--color-accent)",
              border: "1.5px solid var(--color-ink)",
              cursor: "pointer",
              fontFamily: "var(--font-system)",
              fontSize: "12px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab strip */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid var(--color-ink)",
            padding: "0 8px",
            background: "var(--bg-window)",
          }}
        >
          <div
            style={{
              padding: "5px 14px",
              fontFamily: "var(--font-system)",
              fontSize: "16px",
              borderBottom: "3px solid var(--color-accent)",
              marginBottom: "-2px",
            }}
          >
            General
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Icon + name row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--color-ink)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              {type === "Application" ? (
                <rect
                  x="4"
                  y="4"
                  width="24"
                  height="24"
                  rx="2"
                  fill="var(--color-teal)"
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                />
              ) : (
                <rect
                  x="6"
                  y="2"
                  width="20"
                  height="28"
                  rx="1"
                  fill="var(--bg-window)"
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                />
              )}
            </svg>
            {isAdmin && onSaveName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                aria-label="Icon name"
                style={inputStyle}
              />
            ) : (
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "15px",
                  color: "var(--color-ink)",
                  wordBreak: "break-all",
                }}
              >
                {name}
              </span>
            )}
          </div>

          {/* Fields */}
          {[
            ["Type", type],
            ...(size ? [["Size", size]] : []),
            ...(location ? [["Location", location]] : []),
            ...(created
              ? [
                  [
                    "Created",
                    new Date(created).toLocaleDateString("de-DE", {
                      dateStyle: "medium",
                    }),
                  ],
                ]
              : []),
            ...(description ? [["Description", description]] : []),
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--font-system)",
                  fontSize: "16px",
                  color: "var(--color-muted)",
                  minWidth: "90px",
                  flexShrink: 0,
                }}
              >
                {label}:
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--color-ink)",
                  wordBreak: "break-word",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 20px 12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          {isAdmin && onSaveName && (
            <button
              onClick={handleSave}
              className="btn"
              style={{
                padding: "4px 20px",
                background: "var(--color-accent)",
                border: "2px solid var(--color-ink)",
                boxShadow: "2px 2px 0 var(--color-ink)",
                fontFamily: "var(--font-system)",
                fontSize: "17px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Apply
            </button>
          )}
          <button
            onClick={isAdmin && onSaveName ? handleSave : onClose}
            className="btn"
            style={{
              padding: "4px 20px",
              background: "var(--bg-window)",
              border: "2px solid var(--color-ink)",
              boxShadow: "2px 2px 0 var(--color-ink)",
              fontFamily: "var(--font-system)",
              fontSize: "17px",
              color: "var(--color-ink)",
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
