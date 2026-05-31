/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef } from "react";
import { type ContextMenuItem } from "@/store/windowStore";

export type { ContextMenuItem };

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  title?: string;
}

export default function ContextMenu({
  x,
  y,
  items,
  onClose,
  title,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        onClose();
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

  const TITLE_H = title ? 24 : 0;
  const ITEM_H = 26;
  const SEP_H = 10;
  const PAD_H = 6;
  const estHeight =
    TITLE_H +
    PAD_H +
    items.reduce((h, it) => h + (it.separator ? SEP_H : ITEM_H), 0);
  const MENU_W = 210;

  const left = Math.min(x, window.innerWidth - MENU_W - 8);
  const top = Math.min(y, window.innerHeight - estHeight - 8);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={title ?? "Context menu"}
      className="context-menu"
      style={{ position: "fixed", left, top, zIndex: 10000 }}
    >
      {title && (
        <div className="context-menu-title" aria-hidden="true">
          {title}
        </div>
      )}

      <div style={{ padding: "3px 0" }}>
        {items.map((item, i) => {
          if (item.separator) {
            return (
              <div
                key={i}
                className="context-menu-separator"
                role="separator"
              />
            );
          }
          return (
            <button
              key={i}
              role="menuitem"
              disabled={item.disabled}
              className={`context-menu-item${item.danger ? " ctx-danger" : ""}`}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  item.onClick();
                  onClose();
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
