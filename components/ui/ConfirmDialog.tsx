/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  title = "Confirm",
  confirmLabel = "OK",
  danger = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="win-border"
        style={{ background: "var(--bg-window)", width: "300px" }}
      >
        <div
          style={{
            height: "28px",
            background: "var(--bg-titlebar)",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "17px",
              color: "white",
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            padding: "16px 18px",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--color-ink)",
          }}
        >
          {message}
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
            padding: "0 18px 14px",
          }}
        >
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn"
            style={{
              padding: "3px 16px",
              background: "var(--bg-window)",
              border: "2px solid var(--color-ink)",
              boxShadow: "2px 2px 0 var(--color-ink)",
              fontFamily: "var(--font-system)",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              padding: "3px 16px",
              background: danger ? "var(--color-accent)" : "var(--bg-titlebar)",
              border: "2px solid var(--color-ink)",
              boxShadow: "2px 2px 0 var(--color-ink)",
              fontFamily: "var(--font-system)",
              fontSize: "16px",
              color: "white",
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
