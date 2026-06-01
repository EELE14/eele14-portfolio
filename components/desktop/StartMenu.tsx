/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef } from "react";
import { APPS } from "@/lib/client/apps";
import { useDesktopStore } from "@/store/windowStore";

export interface StartMenuProps {
  onClose: () => void;
}

export default function StartMenu({ onClose }: StartMenuProps) {
  const { openWindow, isAdmin, setAdmin } = useDesktopStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const visibleApps = APPS.filter((a) => !a.adminOnly || isAdmin);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Start menu"
      style={{
        position: "absolute",
        bottom: "36px",
        left: 0,
        width: "240px",
        background: "var(--bg-titlebar)",
        border: "2px solid var(--color-ink)",
        boxShadow: "3px -3px 0px var(--color-ink)",
        zIndex: 8000,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: "var(--color-accent)",
          padding: "10px 14px",
          fontFamily: "var(--font-system)",
          fontSize: "22px",
          color: "white",
          letterSpacing: "1px",
          borderBottom: "2px solid var(--color-ink)",
        }}
      >
        EELE OS
        {isAdmin && (
          <span
            style={{
              display: "block",
              fontSize: "13px",
              color: "rgba(255,255,255,0.7)",
              marginTop: "2px",
            }}
          >
            Administrator
          </span>
        )}
      </div>

      {/* App list */}
      <nav aria-label="Applications">
        {visibleApps.map((app) => (
          <button
            key={app.id}
            role="menuitem"
            onClick={() => {
              openWindow(app.id);
              onClose();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openWindow(app.id);
                onClose();
              }
            }}
            className="start-menu-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "7px 14px",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              textAlign: "left",
              color: "white",
              fontFamily: "var(--font-system)",
              fontSize: "17px",
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "scale(0.58)",
                transformOrigin: "center",
              }}
              aria-hidden="true"
            >
              {app.icon}
            </span>
            <span>{app.title}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "rgba(255,255,255,0.12)",
          margin: "4px 0",
        }}
      />

      {/* Bottom actions */}
      {isAdmin && (
        <button
          role="menuitem"
          onClick={() => {
            fetch("/api/auth/logout", { method: "POST" }).finally(() => {
              setAdmin(false);
              onClose();
            });
          }}
          className="start-menu-action"
          style={{
            display: "block",
            width: "100%",
            padding: "7px 14px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            color: "var(--color-muted)",
            fontFamily: "var(--font-system)",
            fontSize: "16px",
          }}
        >
          Log Off Administrator
        </button>
      )}
    </div>
  );
}
