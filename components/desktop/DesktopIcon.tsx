/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import { type ContextMenuItem } from "./ContextMenu";
import PropertiesDialog from "@/components/windows/PropertiesDialog";
import { useDesktopStore } from "@/store/windowStore";

export interface DesktopIconProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultPosition: { x: number; y: number };
  onOpen: () => void;
  onPositionChange?: (id: string, pos: { x: number; y: number }) => void;
  description?: string;
  type?: string;
  isAdmin?: boolean;
  onRename?: (newLabel: string) => void;
  onDelete?: () => void;
  appExtraItems?: ContextMenuItem[];
  marqueeSelected?: boolean;
}

export default function DesktopIcon({
  id,
  label,
  icon,
  defaultPosition,
  onOpen,
  onPositionChange,
  description,
  type = "Application",
  isAdmin = false,
  onRename,
  onDelete,
  appExtraItems = [],
  marqueeSelected = false,
}: DesktopIconProps) {
  const [pos, setPos] = useState(defaultPosition);
  const [prevDefaultPosition, setPrevDefaultPosition] =
    useState(defaultPosition);
  if (
    prevDefaultPosition.x !== defaultPosition.x ||
    prevDefaultPosition.y !== defaultPosition.y
  ) {
    setPrevDefaultPosition(defaultPosition);
    setPos(defaultPosition);
  }

  const { showContextMenu } = useDesktopStore();

  const [selected, setSelected] = useState(false);
  const [showProps, setShowProps] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState(label);
  const [prevLabel, setPrevLabel] = useState(label);
  if (prevLabel !== label) {
    setPrevLabel(label);
    setRenameValue(label);
  }
  const renameInputRef = useRef<HTMLInputElement>(null);

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerOrigin = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const iconRef = useRef<HTMLDivElement>(null);

  // Deselect on click elsewhere
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (iconRef.current && !iconRef.current.contains(e.target as Node)) {
        setSelected(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (showRename) renameInputRef.current?.focus();
  }, [showRename]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging.current = true;
    if (iconRef.current) iconRef.current.style.cursor = "grabbing";
    dragMoved.current = false;
    const rect = iconRef.current?.getBoundingClientRect();
    if (rect) {
      containerOrigin.current = { x: rect.left - pos.x, y: rect.top - pos.y };
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    iconRef.current?.setPointerCapture(e.pointerId);
    setSelected(true);
  };

  const clamp = (x: number, y: number) => {
    const parent = iconRef.current?.offsetParent as HTMLElement | null;
    const iw = iconRef.current?.offsetWidth ?? 80;
    const ih = iconRef.current?.offsetHeight ?? 80;
    const maxX = parent ? parent.clientWidth - iw : x;
    const maxY = parent ? parent.clientHeight - ih : y;
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    dragMoved.current = true;
    setPos(
      clamp(
        e.clientX - dragOffset.current.x - containerOrigin.current.x,
        e.clientY - dragOffset.current.y - containerOrigin.current.y,
      ),
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (iconRef.current) iconRef.current.style.cursor = "default";
    if (dragMoved.current) {
      const finalPos = clamp(
        e.clientX - dragOffset.current.x - containerOrigin.current.x,
        e.clientY - dragOffset.current.y - containerOrigin.current.y,
      );
      setPos(finalPos);
      onPositionChange?.(id, finalPos);
    }
  };

  const handleDoubleClick = () => {
    if (!dragMoved.current) onOpen();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const items: ContextMenuItem[] = [
      { label: "Open", onClick: onOpen },
      ...(appExtraItems.length > 0 ? appExtraItems : []),
      { label: "", onClick: () => {}, separator: true },
      { label: "Properties", onClick: () => setShowProps(true) },
      ...(isAdmin
        ? [
            { label: "", onClick: () => {}, separator: true as const },
            { label: "Rename", onClick: () => setShowRename(true) },
            {
              label: "Delete",
              onClick: () => onDelete?.(),
              danger: true as const,
            },
          ]
        : []),
    ];
    showContextMenu(e.clientX, e.clientY, items, label);
  };

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== label) onRename?.(trimmed);
    setShowRename(false);
  }

  return (
    <>
      <div
        ref={iconRef}
        role="button"
        tabIndex={0}
        aria-label={`${label} — double-click to open`}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: 80,
          textAlign: "center",
          cursor: "default",
          userSelect: "none",
          outline: "none",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            margin: "0 auto 4px",
            padding: "2px",
            background:
              selected || marqueeSelected
                ? "rgba(232,71,42,0.18)"
                : "transparent",
            border:
              selected || marqueeSelected
                ? "1px dashed var(--color-accent)"
                : "1px solid transparent",
          }}
        >
          {icon}
        </div>

        <span
          style={
            {
              display: "block",
              fontFamily: "var(--font-system)",
              fontSize: "14px",
              lineHeight: 1.2,
              wordBreak: "break-word",
              background:
                selected || marqueeSelected
                  ? "var(--color-accent)"
                  : "transparent",
              color: selected || marqueeSelected ? "white" : "var(--color-ink)",
              padding: "1px 3px",
            } as React.CSSProperties
          }
        >
          {label}
        </span>
      </div>

      {showProps && (
        <PropertiesDialog
          name={label}
          type={type}
          description={description}
          isAdmin={isAdmin}
          onSaveName={onRename}
          onClose={() => setShowProps(false)}
        />
      )}

      {/* Rename dialog */}
      {showRename && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 11000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRename(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Rename icon"
            className="win-border"
            style={{ background: "var(--bg-window)", width: "300px" }}
          >
            <div
              style={{
                height: "28px",
                background: "var(--bg-titlebar)",
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-system)",
                  fontSize: "17px",
                  color: "white",
                }}
              >
                Rename
              </span>
            </div>
            <div
              style={{
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <label
                htmlFor={`rename-${id}`}
                style={{
                  fontFamily: "var(--font-system)",
                  fontSize: "15px",
                  color: "var(--color-ink)",
                }}
              >
                New name:
              </label>
              <input
                id={`rename-${id}`}
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") setShowRename(false);
                }}
                style={{
                  border: "2px solid var(--color-ink)",
                  padding: "4px 8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--color-ink)",
                  background: "white",
                  outline: "none",
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowRename(false)}
                  className="btn"
                  style={{
                    padding: "3px 16px",
                    background: "var(--bg-window)",
                    border: "2px solid var(--color-ink)",
                    boxShadow: "2px 2px 0 var(--color-ink)",
                    fontFamily: "var(--font-system)",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitRename}
                  className="btn"
                  style={{
                    padding: "3px 16px",
                    background: "var(--color-accent)",
                    border: "2px solid var(--color-ink)",
                    boxShadow: "2px 2px 0 var(--color-ink)",
                    fontFamily: "var(--font-system)",
                    fontSize: "16px",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
