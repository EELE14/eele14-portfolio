/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid var(--color-ink)",
  padding: "4px 8px",
  fontFamily: "var(--font-body)",
  fontSize: "14px",
  color: "var(--color-ink)",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-system)",
  fontSize: "16px",
  color: "var(--color-ink)",
  marginBottom: "3px",
};

export default function ContactMail() {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!from.trim() || !subject.trim() || !message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName: from, subject, message }),
      });
      if (res.ok) {
        setStatus("sent");
        setFrom("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
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
          gap: "4px",
          padding: "4px 8px",
          borderBottom: "2px solid var(--color-ink)",
          background: "var(--bg-window)",
          flexShrink: 0,
          alignItems: "center",
        }}
      >
        <button
          type="submit"
          form="mail-form"
          disabled={status === "sending" || status === "sent"}
          aria-label="Send message"
          className="btn"
          style={{
            padding: "3px 14px",
            background:
              status === "sent" ? "var(--color-teal)" : "var(--color-accent)",
            border: "2px solid var(--color-ink)",
            boxShadow: "2px 2px 0 var(--color-ink)",
            fontFamily: "var(--font-system)",
            fontSize: "18px",
            color: "white",
            cursor:
              status === "sending" || status === "sent" ? "default" : "pointer",
          }}
        >
          {status === "sending"
            ? "Sending…"
            : status === "sent"
              ? "Sent ✓"
              : "Send"}
        </button>

        <div
          style={{
            width: "2px",
            height: "20px",
            background: "rgba(0,0,0,0.2)",
            margin: "0 4px",
          }}
        />

        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "16px",
            color: "var(--color-muted)",
          }}
        >
          New Message
        </span>
      </div>

      {/* Status banner */}
      {status === "error" && (
        <div
          role="alert"
          style={{
            padding: "6px 12px",
            background: "var(--color-accent)",
            color: "white",
            fontFamily: "var(--font-system)",
            fontSize: "16px",
            flexShrink: 0,
          }}
        >
          Could not send message. Check database connection and try again.
        </div>
      )}
      {status === "sent" && (
        <div
          role="status"
          style={{
            padding: "6px 12px",
            background: "var(--color-teal)",
            color: "white",
            fontFamily: "var(--font-system)",
            fontSize: "16px",
            flexShrink: 0,
          }}
        >
          Message sent! I&apos;ll get back to you soon.
        </div>
      )}

      {/* Form */}
      <form
        id="mail-form"
        onSubmit={handleSend}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {/* Header fields */}
        <div
          style={{
            borderBottom: "1px solid var(--color-ink)",
            padding: "8px 12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <span style={{ ...labelStyle, marginBottom: 0, minWidth: "64px" }}>
              From:
            </span>
            <input
              id="mail-from"
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
              placeholder="Your name"
              aria-label="Your name"
              style={{ ...fieldStyle, flex: 1 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ ...labelStyle, marginBottom: 0, minWidth: "64px" }}>
              To:
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--color-muted)",
              }}
            >
              EELE &lt;hi@eele14.dev&gt;
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "6px",
            }}
          >
            <span style={{ ...labelStyle, marginBottom: 0, minWidth: "64px" }}>
              Subject:
            </span>
            <input
              id="mail-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="What's it about?"
              aria-label="Subject"
              style={{ ...fieldStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Message body */}
        <div
          style={{
            flex: 1,
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label htmlFor="mail-message" style={labelStyle}>
            Message:
          </label>
          <textarea
            id="mail-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder={`Write your message here…

Please add an email address or some other means of contact in your message if you would like a reply :)`}
            aria-label="Message body"
            style={{
              ...fieldStyle,
              flex: 1,
              resize: "none",
              lineHeight: 1.6,
              minHeight: "120px",
            }}
          />
        </div>
      </form>
    </div>
  );
}
