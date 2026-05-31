/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import { useDesktopStore } from "@/store/windowStore";

const FALLBACK = `Loading bio...

If you see this message, the database is not yet configured.`;

interface NotepadProps {
  url?: string;
  filename?: string;
  fsId?: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function Notepad({ url, filename, fsId }: NotepadProps = {}) {
  const showContextMenu = useDesktopStore((s) => s.showContextMenu);
  const isAdmin = useDesktopStore((s) => s.isAdmin);

  const [content, setContent] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const savedRef = useRef<string | null>(null);

  const editable = !!fsId && isAdmin;

  useEffect(() => {
    if (url) {
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        })
        .then((text) => {
          setContent(text);
          savedRef.current = text;
        })
        .catch(() => {
          setWarn(true);
          setContent("(Could not load file)");
        });
    } else {
      fetch("/api/bio")
        .then((r) => r.json())
        .then((data: unknown) => {
          const d = data as { bio?: string };
          const text = d.bio && d.bio.trim() ? d.bio : FALLBACK;
          setContent(text);
          savedRef.current = text;
        })
        .catch(() => {
          setWarn(true);
          setContent(FALLBACK);
        });
    }
  }, [url]);

  async function handleSave() {
    if (!fsId || content === null) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/fs/${fsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      savedRef.current = content;
      setDirty(false);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setDirty(e.target.value !== savedRef.current);
    if (saveState === "saved") setSaveState("idle");
  }

  const statusText = (() => {
    if (!editable) return "Read Only — Ln 1, Col 1";
    if (saveState === "saving") return "Saving…";
    if (saveState === "saved") return "Saved";
    if (saveState === "error") return "Error saving, check connection";
    return dirty ? "Modified" : "Ln 1, Col 1";
  })();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "white",
      }}
    >
      {/* Menu bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          padding: "2px 8px",
          borderBottom: "1px solid var(--color-ink)",
          background: "var(--bg-window)",
          flexShrink: 0,
        }}
      >
        {["File", "Edit", "Format", "View", "Help"].map((m) => (
          <span
            key={m}
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "16px",
              color: "var(--color-ink)",
              padding: "2px 4px",
            }}
            aria-hidden="true"
          >
            {m}
          </span>
        ))}
        {editable && (
          <button
            onClick={() => void handleSave()}
            disabled={!dirty || saveState === "saving"}
            style={{
              marginLeft: "auto",
              padding: "1px 10px",
              fontFamily: "var(--font-system)",
              fontSize: "15px",
              background: dirty ? "var(--color-accent)" : "var(--bg-window)",
              color: dirty ? "white" : "var(--color-muted)",
              border: "1.5px solid var(--color-ink)",
              cursor: dirty ? "pointer" : "default",
            }}
          >
            Save
          </button>
        )}
      </div>

      {warn && (
        <div
          style={{
            padding: "4px 8px",
            background: "#fff3cd",
            borderBottom: "1px solid #ffc107",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "#856404",
          }}
        >
          Could not connect to database, showing placeholder content.
        </div>
      )}

      {editable ? (
        <textarea
          value={content ?? ""}
          onChange={handleChange}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
              e.preventDefault();
              void handleSave();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e.clientX, e.clientY, [
              {
                label: "Save",
                onClick: () => void handleSave(),
                disabled: !dirty,
              },
              {
                label: "Copy all",
                onClick: () =>
                  void navigator.clipboard.writeText(content ?? ""),
              },
            ]);
          }}
          aria-label={`${filename ?? "file"} — editable`}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            padding: "12px",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: 1.7,
            color: "var(--color-ink)",
            background: "white",
          }}
        />
      ) : (
        <div
          role="region"
          aria-label={`${filename ?? "about.txt"} — read only`}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e.clientX, e.clientY, [
              {
                label: "Copy text",
                onClick: () =>
                  void navigator.clipboard.writeText(content ?? ""),
                disabled: content === null,
              },
              { label: "Print", onClick: () => window.print() },
            ]);
          }}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "12px",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: 1.7,
            color: "var(--color-ink)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: "text",
          }}
        >
          {content === null ? (
            <span style={{ color: "var(--color-muted)" }}>Loading…</span>
          ) : (
            content
          )}
        </div>
      )}

      <div
        style={{
          padding: "2px 8px",
          borderTop: "1px solid var(--color-ink)",
          fontFamily: "var(--font-system)",
          fontSize: "14px",
          color:
            saveState === "error"
              ? "var(--color-accent)"
              : "var(--color-muted)",
          flexShrink: 0,
        }}
      >
        {statusText}
      </div>
    </div>
  );
}
