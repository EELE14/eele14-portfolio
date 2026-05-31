/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useState } from "react";

const MAX_CHARS = 1000;

export default function GuestbookEditor({ filename }: { filename: string }) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errMsg, setErrMsg] = useState("");

  const charsLeft = MAX_CHARS - content.length;
  const isSaved = status === "saved";

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) {
      setErrMsg("Write something before saving.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setErrMsg("");
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: filename, message: trimmed }),
      });
      if (res.ok) {
        setStatus("saved");
      } else {
        const data = (await res.json()) as { error?: string };
        const err = data.error ?? "";
        const isFixable =
          res.status === 422 &&
          (err.includes("required") || err.includes("characters or fewer"));
        if (isFixable) {
          setErrMsg(err);
          setStatus("error");
        } else {
          localStorage.setItem(
            "guestbook_shadow",
            JSON.stringify({
              name: filename,
              message: trimmed,
              createdAt: new Date().toISOString(),
            }),
          );
          setStatus("saved");
        }
      }
    } catch {
      setErrMsg("Network error, check your connection.");
      setStatus("error");
    }
  }

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
          borderBottom: "1px solid var(--color-ink)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            flex: 1,
            color: "var(--color-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename}.txt
          {!isSaved && " — unsaved"}
        </span>

        {!isSaved && (
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="btn"
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              padding: "2px 14px",
              border: "2px solid var(--color-ink)",
              boxShadow: "2px 2px 0 var(--color-ink)",
              background: "var(--color-ink)",
              color: "var(--bg-window)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        )}

        {isSaved && (
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              color: "var(--color-teal)",
              flexShrink: 0,
            }}
          >
            Saved
          </span>
        )}
      </div>

      {/* Editor area */}
      <textarea
        value={content}
        onChange={(e) => {
          if (!isSaved) setContent(e.target.value);
        }}
        readOnly={isSaved}
        maxLength={MAX_CHARS}
        placeholder={
          isSaved
            ? ""
            : `Type your message here…\n\nURLs and friendly messages are welcome. Anything bad is not and will be moderated.`
        }
        style={{
          flex: 1,
          width: "100%",
          padding: "12px",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          lineHeight: 1.65,
          border: "none",
          outline: "none",
          resize: "none",
          background: isSaved ? "var(--bg-window)" : "white",
          color: "var(--color-ink)",
          boxSizing: "border-box",
          opacity: isSaved ? 0.8 : 1,
        }}
      />

      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "3px 8px",
          borderTop: "1px solid var(--color-ink)",
          flexShrink: 0,
          minHeight: "24px",
        }}
      >
        {status === "error" ? (
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "13px",
              color: "var(--color-accent)",
            }}
          >
            {errMsg}
          </span>
        ) : isSaved ? (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-muted)",
            }}
          >
            File is read-only. Navigate back to Guestbook folder to see it.
          </span>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-muted)",
            }}
          >
            One entry per visitor.
          </span>
        )}

        {!isSaved && (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color:
                charsLeft < 100 ? "var(--color-accent)" : "var(--color-muted)",
              flexShrink: 0,
              marginLeft: "8px",
            }}
          >
            {charsLeft} / {MAX_CHARS}
          </span>
        )}
      </div>
    </div>
  );
}
