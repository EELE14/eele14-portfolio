/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { Tab } from "../types";
import { MAX_TABS } from "../types";
import { IconClose, IconNewTab } from "@/components/icons/NavIcons";

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onNewTab: () => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onNewTab,
}: TabBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        padding: "4px 6px 0",
        background: "var(--bg-window)",
        borderBottom: "2px solid var(--color-ink)",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 6px 3px 8px",
              minWidth: 80,
              maxWidth: 160,
              height: 26,
              border: "2px solid var(--color-ink)",
              borderBottom: isActive
                ? "2px solid var(--bg-window)"
                : "2px solid var(--color-ink)",
              background: isActive
                ? "var(--bg-window)"
                : "color-mix(in srgb, var(--bg-window) 70%, var(--color-ink) 30%)",
              cursor: "pointer",
              flexShrink: 1,
              position: "relative",
              marginBottom: isActive ? -2 : 0,
              userSelect: "none",
            }}
          >
            {tab.loading && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  flexShrink: 0,
                  animation: "pulse 1s ease-in-out infinite",
                }}
              />
            )}
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-body)",
                color: "var(--color-ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                minWidth: 0,
              }}
            >
              {tab.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              className="tab-close-btn"
              style={{
                width: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-ink)",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <IconClose />
            </button>
          </div>
        );
      })}

      {tabs.length < MAX_TABS && (
        <button
          onClick={onNewTab}
          title="New Tab"
          style={{
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "2px solid var(--color-ink)",
            cursor: "pointer",
            color: "var(--color-ink)",
            padding: 0,
            flexShrink: 0,
            marginBottom: 0,
          }}
        >
          <IconNewTab />
        </button>
      )}
    </div>
  );
}
