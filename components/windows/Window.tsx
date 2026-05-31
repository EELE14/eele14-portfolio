/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd, type DraggableData, type ResizableDelta } from "react-rnd";
import type { DraggableEvent } from "react-draggable";
import type { ResizeDirection } from "re-resizable";
import { useDesktopStore } from "@/store/windowStore";
import { getApp } from "@/lib/client/apps";
import PropertiesDialog from "./PropertiesDialog";

export interface WindowProps {
  id: string;
  appId?: string;
  title: string;
  children: React.ReactNode;
  zIndex: number;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
}

export default function Window({
  id,
  appId,
  title,
  children,
  zIndex,
  isMaximized,
  position,
  size,
  minWidth = 280,
  minHeight = 180,
}: WindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowGeometry,
    showContextMenu,
  } = useDesktopStore();

  const [showProps, setShowProps] = useState(false);

  const rndRef = useRef<Rnd>(null);
  const savedGeo = useRef({ position, size });
  const wasMaximized = useRef(isMaximized);

  useEffect(() => {
    if (!rndRef.current) return;
    if (isMaximized && !wasMaximized.current) {
      rndRef.current.updatePosition({ x: 0, y: 0 });
      rndRef.current.updateSize({
        width: window.innerWidth,
        height: window.innerHeight - 36,
      });
    } else if (!isMaximized && wasMaximized.current) {
      rndRef.current.updatePosition(savedGeo.current.position);
      rndRef.current.updateSize(savedGeo.current.size);
    }
    wasMaximized.current = isMaximized;
  }, [isMaximized]);

  const handleDragStop = (_e: DraggableEvent, d: DraggableData) => {
    savedGeo.current.position = { x: d.x, y: d.y };
    updateWindowGeometry(id, { x: d.x, y: d.y }, savedGeo.current.size);
  };

  const handleResizeStop = (
    _e: MouseEvent | TouchEvent,
    _dir: ResizeDirection,
    ref: HTMLElement,
    _delta: ResizableDelta,
    pos: { x: number; y: number },
  ) => {
    const newSize = { width: ref.clientWidth, height: ref.clientHeight };
    savedGeo.current.size = newSize;
    savedGeo.current.position = pos;
    updateWindowGeometry(id, pos, newSize);
  };

  return (
    <Rnd
      ref={rndRef}
      default={{
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      }}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds="parent"
      dragHandleClassName="win-titlebar-drag"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{ zIndex }}
      onMouseDown={() => focusWindow(id)}
    >
      <div
        className="win-border"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if ((e.target as HTMLElement).closest("[data-no-ctx-menu]")) return;
          showContextMenu(
            e.clientX,
            e.clientY,
            [
              { label: "Minimize", onClick: () => minimizeWindow(id) },
              {
                label: isMaximized ? "Restore" : "Maximize",
                onClick: () => maximizeWindow(id),
              },
              { label: "", onClick: () => {}, separator: true },
              { label: "Close", onClick: () => closeWindow(id), danger: true },
              { label: "", onClick: () => {}, separator: true },
              { label: "Properties", onClick: () => setShowProps(true) },
            ],
            title,
          );
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "var(--bg-window)",
          overflow: "hidden",
        }}
      >
        <div
          className="win-titlebar-drag"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "30px",
            background: "var(--bg-titlebar)",
            padding: "0 8px",
            flexShrink: 0,
            cursor: isMaximized ? "default" : "move",
            userSelect: "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-system)",
              fontSize: "18px",
              color: "white",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              marginRight: "8px",
              pointerEvents: "none",
            }}
          >
            {title}
          </span>

          <div
            style={{ display: "flex", gap: "2px", flexShrink: 0 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => minimizeWindow(id)}
              aria-label="Minimize window"
              className="btn"
              style={winBtn()}
            >
              <span
                aria-hidden="true"
                style={{ fontSize: "10px", lineHeight: 1 }}
              >
                _
              </span>
            </button>

            <button
              onClick={() => maximizeWindow(id)}
              aria-label={isMaximized ? "Restore window" : "Maximize window"}
              className="btn"
              style={winBtn()}
            >
              <span
                aria-hidden="true"
                style={{ fontSize: "9px", lineHeight: 1 }}
              >
                {isMaximized ? "⊡" : "□"}
              </span>
            </button>

            <button
              onClick={() => closeWindow(id)}
              aria-label="Close window"
              className="btn"
              style={{ ...winBtn(), fontWeight: "bold" }}
            >
              <span
                aria-hidden="true"
                style={{ fontSize: "10px", lineHeight: 1 }}
              >
                ✕
              </span>
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--color-ink)",
          }}
        >
          {children}
        </div>
      </div>

      {showProps && (
        <PropertiesDialog
          name={getApp(appId ?? "")?.title ?? title}
          type="Application"
          description={getApp(appId ?? "")?.description}
          onClose={() => setShowProps(false)}
        />
      )}
    </Rnd>
  );
}

function winBtn(): React.CSSProperties {
  return {
    width: "20px",
    height: "16px",
    background: "var(--bg-window)",
    border: "1.5px solid var(--color-ink)",
    boxShadow: "1px 1px 0 var(--color-ink)",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-ink)",
    flexShrink: 0,
    fontFamily: "var(--font-system)",
  };
}
