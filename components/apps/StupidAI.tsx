/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "ai";

interface Message {
  id: number;
  role: Role;
  content: string;
  streaming: boolean;
  error: boolean;
}

let nextId = 0;

function StreamingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      style={{
        display: "inline-block",
        width: "9px",
        height: "1em",
        background: "var(--color-ink)",
        verticalAlign: "text-bottom",
        opacity: visible ? 1 : 0,
      }}
    />
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "75%",
            background: "var(--color-ink)",
            color: "var(--bg-window)",
            padding: "6px 10px",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            border: "2px solid var(--color-ink)",
            boxShadow: "2px 2px 0 var(--color-muted)",
          }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          maxWidth: "85%",
          background: msg.error ? "var(--color-accent)" : "var(--bg-window)",
          color: msg.error ? "white" : "var(--color-ink)",
          padding: "6px 10px",
          fontFamily: "var(--font-system)",
          fontSize: "15px",
          border: `2px solid ${msg.error ? "var(--color-accent)" : "var(--color-ink)"}`,
          boxShadow: "2px 2px 0 var(--color-ink)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.4,
        }}
      >
        {msg.content || (msg.streaming ? "" : "…")}
        {msg.streaming && <StreamingCursor />}
      </div>
    </div>
  );
}

export default function StupidAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const prompt = input.trim();
    if (!prompt || busy) return;

    setInput("");
    setBusy(true);

    const userId = ++nextId;
    const aiId = ++nextId;

    setMessages((prev) => [
      ...prev,
      {
        id: userId,
        role: "user",
        content: prompt,
        streaming: false,
        error: false,
      },
      { id: aiId, role: "ai", content: "", streaming: true, error: false },
    ]);

    const patchAi = (patch: Partial<Message>) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, ...patch } : m)),
      );

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        patchAi({
          content: err.error ?? `Error ${res.status}`,
          streaming: false,
          error: true,
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              content: string;
              stop: boolean;
            };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiId
                  ? {
                      ...m,
                      content: m.content + data.content,
                      streaming: !data.stop,
                    }
                  : m,
              ),
            );
            if (data.stop) break outer;
          } catch {
            // partial chunk
          }
        }
      }

      patchAi({ streaming: false });
    } catch (err) {
      patchAi({
        content: err instanceof Error ? err.message : "Network error",
        streaming: false,
        error: true,
      });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const sendDisabled = busy || !input.trim();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-window)",
      }}
    >
      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--color-muted)",
              textAlign: "center",
              marginTop: "48px",
              lineHeight: 1.6,
            }}
          >
            Ask anything.
            <br />
            The AI will try its best.
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "2px solid var(--color-ink)",
          display: "flex",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void sendMessage();
          }}
          disabled={busy}
          placeholder={busy ? "Generating…" : "Type a question…"}
          style={{
            flex: 1,
            border: "2px solid var(--color-ink)",
            padding: "4px 8px",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--color-ink)",
            background: busy ? "var(--color-muted)" : "white",
            outline: "none",
            opacity: busy ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={sendDisabled}
          className="btn"
          style={{
            padding: "4px 18px",
            background: sendDisabled ? "var(--bg-window)" : "var(--color-ink)",
            border: "2px solid var(--color-ink)",
            boxShadow: sendDisabled ? "none" : "2px 2px 0 var(--color-ink)",
            fontFamily: "var(--font-system)",
            fontSize: "16px",
            color: sendDisabled ? "var(--color-muted)" : "var(--bg-window)",
            cursor: sendDisabled ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
