/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import { useDesktopStore } from "@/store/windowStore";

type Status = "idle" | "loading" | "error";

export default function SecurityDialog() {
  const {
    setShowSecurityDialog,
    setAdmin,
    setInboxUnread,
    isAdmin,
    openWindow,
  } = useDesktopStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSecurityDialog(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setShowSecurityDialog]);

  async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setAdmin(true);
        setShowSecurityDialog(false);
        fetch("/api/messages/unread")
          .then((r) => r.json())
          .then((d: { count?: number }) => setInboxUnread(d.count ?? 0))
          .catch(() => {});
      } else {
        setStatus("error");
        setPassword("");
      }
    } catch {
      setStatus("error");
      setPassword("");
    }
  }

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
        background: "rgba(0,0,0,0.6)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Windows Security"
        className="win-border"
        style={{
          background: "var(--bg-window)",
          width: "380px",
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
            Windows Security
          </span>
          <button
            onClick={() => setShowSecurityDialog(false)}
            aria-label="Close"
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

        {/* Header banner */}
        <div
          style={{
            background: "var(--bg-titlebar)",
            borderBottom: "3px solid var(--color-accent)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect width="40" height="40" fill="var(--color-accent)" />
            <rect x="5" y="5" width="13" height="13" fill="white" />
            <rect x="22" y="5" width="13" height="13" fill="white" />
            <rect x="5" y="22" width="13" height="13" fill="white" />
            <rect x="22" y="22" width="13" height="13" fill="white" />
          </svg>
          <div>
            <div
              style={{
                fontFamily: "var(--font-system)",
                fontSize: "16px",
                color: "white",
              }}
            >
              EELE OS
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {isAdmin ? "Logged in as Administrator" : "Log on to Windows"}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 20px 12px" }}>
          {isAdmin ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--color-ink)",
                  margin: 0,
                }}
              >
                You are currently logged in as Administrator. You can lock the
                workstation or log off.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowSecurityDialog(false);
                    openWindow("taskmgr.exe");
                  }}
                  className="btn"
                  style={cancelBtn}
                >
                  Task Manager
                </button>
                <button
                  type="button"
                  onClick={() => setShowSecurityDialog(false)}
                  className="btn"
                  style={cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  style={primaryBtn}
                  onClick={() => {
                    document.cookie = `portfolio_session=; path=/; max-age=0; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
                    setAdmin(false);
                    setShowSecurityDialog(false);
                  }}
                >
                  Log Off
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {status === "error" && (
                <div
                  role="alert"
                  style={{
                    padding: "6px 10px",
                    background: "var(--color-accent)",
                    color: "white",
                    fontFamily: "var(--font-system)",
                    fontSize: "14px",
                  }}
                >
                  Logon failure: unknown user name or bad password.
                </div>
              )}

              <div>
                <label
                  htmlFor="sec-email"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-system)",
                    fontSize: "15px",
                    color: "var(--color-ink)",
                    marginBottom: "3px",
                  }}
                >
                  User name:
                </label>
                <input
                  id="sec-email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="sec-password"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-system)",
                    fontSize: "15px",
                    color: "var(--color-ink)",
                    marginBottom: "3px",
                  }}
                >
                  Password:
                </label>
                <input
                  id="sec-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                  marginTop: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowSecurityDialog(false);
                    openWindow("taskmgr.exe");
                  }}
                  className="btn"
                  style={cancelBtn}
                >
                  Task Manager
                </button>
                <button
                  type="button"
                  onClick={() => setShowSecurityDialog(false)}
                  className="btn"
                  style={cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn"
                  style={primaryBtn}
                >
                  {status === "loading" ? "Logging on…" : "OK"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div
          style={{
            padding: "6px 20px 10px",
            borderTop: "1px solid var(--color-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--color-muted)",
          }}
        >
          Press Ctrl+Alt+Delete to access Windows Security
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid var(--color-ink)",
  padding: "3px 6px",
  fontFamily: "var(--font-body)",
  fontSize: "14px",
  color: "var(--color-ink)",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  padding: "4px 20px",
  background: "var(--color-accent)",
  border: "2px solid var(--color-ink)",
  boxShadow: "2px 2px 0 var(--color-ink)",
  fontFamily: "var(--font-system)",
  fontSize: "16px",
  color: "white",
  cursor: "pointer",
};

const cancelBtn: React.CSSProperties = {
  padding: "4px 20px",
  background: "var(--bg-window)",
  border: "2px solid var(--color-ink)",
  boxShadow: "2px 2px 0 var(--color-ink)",
  fontFamily: "var(--font-system)",
  fontSize: "16px",
  color: "var(--color-ink)",
  cursor: "pointer",
};
