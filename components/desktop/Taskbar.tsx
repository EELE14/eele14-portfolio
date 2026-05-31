/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDesktopStore } from "@/store/windowStore";
import StartMenu from "./StartMenu";

function DateTimeDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Date/Time Properties"
      className="win-border"
      style={{
        position: "absolute",
        bottom: "40px",
        right: "4px",
        width: "280px",
        background: "var(--bg-window)",
        zIndex: 8000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "28px",
          background: "var(--bg-titlebar)",
          padding: "0 8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "17px",
            color: "white",
          }}
        >
          Date/Time Properties
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-dot"
          style={{
            width: "18px",
            height: "18px",
            background: "var(--color-accent)",
            border: "1.5px solid var(--color-ink)",
            cursor: "pointer",
            color: "white",
            fontFamily: "var(--font-system)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            color: "var(--color-muted)",
          }}
        >
          Availability
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--color-ink)",
            lineHeight: 1.6,
          }}
        >
          Open to freelance and part-time projects.
          <br />
          Best reached via hi@eele14.dev
          <br />
          Response time: usually within 48 hours.
        </div>
        <div
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            color: "var(--color-muted)",
            marginTop: "4px",
          }}
        >
          Timezone
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--color-ink)",
          }}
        >
          Europe/Berlin (CET/CEST)
        </div>
        <button
          onClick={onClose}
          className="btn"
          style={{
            marginTop: "6px",
            padding: "4px 16px",
            background: "var(--bg-window)",
            border: "2px solid var(--color-ink)",
            boxShadow: "2px 2px 0 var(--color-ink)",
            fontFamily: "var(--font-system)",
            fontSize: "16px",
            cursor: "pointer",
            alignSelf: "flex-end",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

interface NetInfo {
  ip: string;
  location: string;
  latency: string;
  visits: string;
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <ellipse cx="7" cy="7" rx="5" ry="3.5" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <line
        x1="2"
        y1="2"
        x2="12"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <ellipse cx="7" cy="7" rx="5" ry="3.5" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SensitiveValue({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const [showTip, setShowTip] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1 }}>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "var(--color-ink)",
          filter: revealed ? "none" : "blur(5px)",
          userSelect: revealed ? "auto" : "none",
          transition: "filter 0.15s",
        }}
      >
        {value}
      </span>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setRevealed((v) => !v)}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          aria-label={revealed ? "Hide value" : "Reveal value"}
          style={{
            display: "flex",
            alignItems: "center",
            background: "none",
            border: "1px solid var(--color-muted)",
            cursor: "pointer",
            padding: "1px 3px",
            color: "var(--color-muted)",
            lineHeight: 1,
          }}
        >
          <EyeIcon visible={revealed} />
        </button>
        {showTip && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 5px)",
              right: 0,
              width: "180px",
              background: "var(--bg-window)",
              border: "2px solid var(--color-ink)",
              boxShadow: "2px 2px 0 var(--color-ink)",
              padding: "5px 7px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-ink)",
              lineHeight: 1.5,
              zIndex: 9000,
              pointerEvents: "none",
            }}
          >
            This data is not stored on any server.
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkDialog({ onClose }: { onClose: () => void }) {
  const [info, setInfo] = useState<NetInfo | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    const t0 = performance.now();
    Promise.all([
      fetch("https://ipapi.co/json/").then((r) => r.json()) as Promise<{
        ip?: string;
        city?: string;
        country_name?: string;
        org?: string;
      }>,
      fetch("/api/visits").then((r) => r.json()) as Promise<{ count?: number }>,
    ])
      .then(([geo, vis]) => {
        const latency = Math.round(performance.now() - t0);
        setInfo({
          ip: geo.ip ?? "—",
          location:
            [geo.city, geo.country_name].filter(Boolean).join(", ") || "—",
          latency: `${latency} ms`,
          visits: (vis.count ?? 0).toLocaleString(),
        });
      })
      .catch(() => {
        setInfo({ ip: "—", location: "—", latency: "—", visits: "—" });
      });
  }, []);

  const rows: [string, string, boolean][] = info
    ? [
        ["Status", "Connected", false],
        ["IP", info.ip, true],
        ["Location", info.location, true],
        ["Latency", info.latency, false],
        ["Visits", info.visits, false],
      ]
    : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Network Status"
      className="win-border"
      style={{
        position: "absolute",
        bottom: "40px",
        right: "4px",
        width: "280px",
        background: "var(--bg-window)",
        zIndex: 8000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "28px",
          background: "var(--bg-titlebar)",
          padding: "0 8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "17px",
            color: "white",
          }}
        >
          Network Status
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-dot"
          style={{
            width: "18px",
            height: "18px",
            background: "var(--color-accent)",
            border: "1.5px solid var(--color-ink)",
            cursor: "pointer",
            color: "white",
            fontFamily: "var(--font-system)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {!info ? (
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--color-muted)",
            }}
          >
            Detecting…
          </span>
        ) : (
          rows.map(([label, value, sensitive]) => (
            <div
              key={label}
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-system)",
                  fontSize: "15px",
                  color: "var(--color-muted)",
                  minWidth: "72px",
                  flexShrink: 0,
                }}
              >
                {label}:
              </span>
              {sensitive ? (
                <SensitiveValue value={value} />
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--color-ink)",
                  }}
                >
                  {value}
                </span>
              )}
            </div>
          ))
        )}
        <button
          onClick={onClose}
          className="btn"
          style={{
            marginTop: "6px",
            padding: "4px 16px",
            background: "var(--bg-window)",
            border: "2px solid var(--color-ink)",
            boxShadow: "2px 2px 0 var(--color-ink)",
            fontFamily: "var(--font-system)",
            fontSize: "16px",
            cursor: "pointer",
            alignSelf: "flex-end",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Clock({ onClick }: { onClick: () => void }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(new Date());
      const get = (type: string) =>
        parts.find((p) => p.type === type)?.value ?? "00";
      setTime(`${get("hour")}:${get("minute")}:${get("second")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <button
      onClick={onClick}
      aria-label={`Current time: ${time} — click for availability info`}
      title="Date/Time Properties"
      style={{
        fontFamily: "var(--font-system)",
        fontSize: "18px",
        color: "white",
        padding: "0 10px",
        letterSpacing: "1px",
        whiteSpace: "nowrap",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      {time}
    </button>
  );
}

export default function Taskbar() {
  const [showDateTime, setShowDateTime] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const {
    windows,
    focusWindow,
    minimizeWindow,
    isAdmin,
    showStartMenu,
    setShowStartMenu,
  } = useDesktopStore();
  const startBtnRef = useRef<HTMLButtonElement>(null);

  const openWindows = windows.filter((w) => w.isOpen);
  const closeStart = useCallback(
    () => setShowStartMenu(false),
    [setShowStartMenu],
  );

  return (
    <div
      style={{
        position: "relative",
        height: "36px",
        background: "var(--bg-titlebar)",
        borderTop: "2px solid var(--color-ink)",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        zIndex: 7000,
        gap: "4px",
        padding: "0 4px",
      }}
      role="toolbar"
      aria-label="Taskbar"
    >
      {/* Dialogs rendered above the taskbar */}
      {showDateTime && (
        <DateTimeDialog onClose={() => setShowDateTime(false)} />
      )}
      {showNetwork && <NetworkDialog onClose={() => setShowNetwork(false)} />}

      {/* Start button */}
      <div style={{ position: "relative" }}>
        {showStartMenu && <StartMenu onClose={closeStart} />}

        <button
          ref={startBtnRef}
          onClick={() => setShowStartMenu(!showStartMenu)}
          aria-haspopup="menu"
          aria-expanded={showStartMenu}
          aria-label="Start menu"
          className="btn-start"
          style={{
            height: "28px",
            padding: "0 12px",
            background: showStartMenu
              ? "var(--color-accent)"
              : "var(--color-teal)",
            border: "2px solid var(--color-ink)",
            boxShadow: showStartMenu
              ? "inset 1px 1px 0 rgba(0,0,0,0.3)"
              : "2px 2px 0 var(--color-ink)",
            cursor: "pointer",
            fontFamily: "var(--font-system)",
            fontSize: "18px",
            color: "white",
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}
        >
          Start
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "2px",
          height: "24px",
          background: "rgba(255,255,255,0.12)",
          flexShrink: 0,
        }}
      />

      {/* Open window buttons */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "3px",
          overflow: "hidden",
          alignItems: "center",
        }}
        role="list"
        aria-label="Open windows"
      >
        {openWindows.map((win) => (
          <button
            key={win.id}
            role="listitem"
            onClick={() => {
              if (win.isMinimized) {
                useDesktopStore.getState().openWindow(win.appId);
              } else {
                focusWindow(win.id);
              }
            }}
            onDoubleClick={() => minimizeWindow(win.id)}
            aria-label={`${win.title}${win.isMinimized ? " (minimized)" : ""}`}
            title={win.title}
            style={{
              height: "26px",
              maxWidth: "160px",
              minWidth: "60px",
              padding: "0 8px",
              background: win.isMinimized
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              fontFamily: "var(--font-system)",
              fontSize: "15px",
              color: win.isMinimized ? "var(--color-muted)" : "white",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {win.title}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          paddingLeft: "6px",
          gap: "6px",
          flexShrink: 0,
          position: "relative",
        }}
        role="status"
        aria-label="System tray"
      >
        <span
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "14px",
            color: isAdmin ? "var(--color-accent)" : "var(--color-muted)",
            border: `1px solid ${isAdmin ? "var(--color-accent)" : "var(--color-muted)"}`,
            padding: "1px 5px",
            letterSpacing: "0.05em",
            flexShrink: 0,
            minWidth: "44px",
            textAlign: "center",
          }}
          title={isAdmin ? "Administrator session active" : "Guest session"}
        >
          {isAdmin ? "root" : "guest"}
        </span>

        {/* Network icon */}
        <button
          onClick={() => {
            setShowNetwork((v) => !v);
            setShowDateTime(false);
          }}
          aria-label="Network status, click for details"
          title="Network: Connected to DE"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 2px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="16"
            height="14"
            viewBox="0 0 16 14"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="12.5" r="1.5" fill="white" />
            <path
              d="M4.5 8.5 Q8 4.5 11.5 8.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M1 5 Q8 -1.5 15 5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>

        <Clock
          onClick={() => {
            setShowDateTime((v) => !v);
            setShowNetwork(false);
          }}
        />
      </div>
    </div>
  );
}
