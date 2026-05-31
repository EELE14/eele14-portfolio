/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useState } from "react";
import { useFetchData } from "@/lib/client/hooks/useFetchData";
import { useDesktopStore } from "@/store/windowStore";

interface Message {
  id: string;
  fromName: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Inbox() {
  const setInboxUnread = useDesktopStore((s) => s.setInboxUnread);
  const { data, loading, error, reload } =
    useFetchData<Message[]>("/api/messages");
  const messages = data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (data) setInboxUnread(data.filter((m) => !m.read).length);
  }, [data, setInboxUnread]);

  async function markRead(id: string, read: boolean) {
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    reload();
  }

  async function deleteMsg(id: string) {
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (expanded === id) setExpanded(null);
    reload();
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "var(--color-muted)",
        }}
      >
        Loading messages…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "var(--color-accent)",
        }}
      >
        Access denied. Log in as Administrator first.
      </div>
    );
  }

  const unread = messages.filter((m) => !m.read).length;

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
          padding: "4px 10px",
          borderBottom: "2px solid var(--color-ink)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            color: "var(--color-ink)",
          }}
        >
          Inbox — {messages.length} message{messages.length !== 1 ? "s" : ""}
          {unread > 0 && ` (${unread} unread)`}
        </span>
        <button
          onClick={reload}
          className="btn"
          style={{
            marginLeft: "auto",
            padding: "2px 12px",
            background: "var(--bg-window)",
            border: "2px solid var(--color-ink)",
            boxShadow: "2px 2px 0 var(--color-ink)",
            fontFamily: "var(--font-system)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {messages.length === 0 && (
          <div
            style={{
              padding: "20px 16px",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--color-muted)",
            }}
          >
            No messages yet.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {/* Row */}
            <div
              onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "7px 14px",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
                background:
                  expanded === msg.id ? "rgba(232,71,42,0.06)" : "transparent",
              }}
            >
              {/* Unread indicator */}
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: msg.read ? "transparent" : "var(--color-accent)",
                  border: "1.5px solid var(--color-accent)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-system)",
                    fontSize: "14px",
                    fontWeight: msg.read ? "normal" : "bold",
                  }}
                >
                  {msg.fromName}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--color-muted)",
                    marginLeft: "8px",
                  }}
                >
                  {msg.subject}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "var(--color-muted)",
                  flexShrink: 0,
                }}
              >
                {new Date(msg.createdAt).toLocaleDateString("de-DE", {
                  dateStyle: "short",
                })}
              </span>
            </div>

            {/* Expanded body */}
            {expanded === msg.id && (
              <div
                style={{
                  padding: "12px 14px 14px 32px",
                  borderBottom: "2px solid var(--color-ink)",
                  background: "rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--color-ink)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                    marginBottom: "10px",
                  }}
                >
                  {msg.message}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => markRead(msg.id, !msg.read)}
                    className="btn"
                    style={{
                      padding: "2px 10px",
                      background: "var(--bg-window)",
                      border: "2px solid var(--color-ink)",
                      boxShadow: "1px 1px 0 var(--color-ink)",
                      fontFamily: "var(--font-system)",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Mark as {msg.read ? "unread" : "read"}
                  </button>
                  <button
                    onClick={() => deleteMsg(msg.id)}
                    className="btn"
                    style={{
                      padding: "2px 10px",
                      background: "var(--color-accent)",
                      border: "2px solid var(--color-ink)",
                      boxShadow: "1px 1px 0 var(--color-ink)",
                      fontFamily: "var(--font-system)",
                      fontSize: "13px",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
