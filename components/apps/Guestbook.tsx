/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import type { GuestbookEntry } from "@/lib/server/guestbook";
import { useDesktopStore } from "@/store/windowStore";

export default function Guestbook() {
  const { showContextMenu, openFileExplorer } = useDesktopStore();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  function load() {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((data: GuestbookEntry[]) => {
        try {
          const raw = localStorage.getItem("guestbook_shadow");
          if (raw) {
            const s = JSON.parse(raw) as {
              name: string;
              message: string;
              createdAt: string;
            };
            const alreadyReal = data.some(
              (e) => e.name.toLowerCase() === s.name.toLowerCase(),
            );
            if (!alreadyReal) {
              data.unshift({
                id: "__shadow__",
                name: s.name,
                message: s.message,
                approved: true,
                blocked: false,
                createdAt: s.createdAt,
              });
            }
          }
        } catch {
          /* ignore bad localStorage */
        }
        setEntries(data);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "1px solid var(--color-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: "var(--font-system)", fontSize: "16px" }}>
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-muted)",
            }}
          >
            Sign via File Explorer → Guestbook
          </span>
          <button
            onClick={load}
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              background: "none",
              border: "1px solid var(--color-ink)",
              padding: "1px 8px",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        style={{ flex: 1, overflowY: "auto", padding: "8px" }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          showContextMenu(e.clientX, e.clientY, [
            { label: "Refresh", onClick: load },
            {
              label: "Sign guestbook",
              onClick: () => openFileExplorer(["Guestbook"]),
            },
          ]);
        }}
      >
        {entries.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              fontFamily: "var(--font-system)",
              fontSize: "16px",
              color: "var(--color-muted)",
              textAlign: "center",
            }}
          >
            No entries yet, open File Explorer and navigate to the Guestbook
            folder to sign.
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                marginBottom: "10px",
                padding: "8px 10px",
                border: "2px solid var(--color-ink)",
                boxShadow: "2px 2px 0 var(--color-ink)",
                background: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-system)",
                    fontSize: "17px",
                    color: "var(--color-ink)",
                  }}
                >
                  {entry.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    color: "var(--color-muted)",
                  }}
                >
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  lineHeight: 1.55,
                  color: "var(--color-ink)",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {entry.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
