/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { Tab } from "../types";
import {
  IconBack,
  IconForward,
  IconRefresh,
  IconHome,
} from "@/components/icons/NavIcons";
import NavButton from "./NavButton";

interface ToolbarProps {
  activeTab: Tab;
  swReady: boolean;
  canGoBack: boolean;
  canGoFwd: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onAddressChange: (val: string) => void;
  onSubmit: () => void;
}

export default function Toolbar({
  activeTab,
  swReady,
  canGoBack,
  canGoFwd,
  onBack,
  onForward,
  onRefresh,
  onHome,
  onAddressChange,
  onSubmit,
}: ToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 6px",
        borderBottom: "2px solid var(--color-ink)",
        background: "var(--bg-window)",
        flexShrink: 0,
      }}
    >
      <NavButton onClick={onBack} disabled={!canGoBack} title="Back">
        <IconBack />
      </NavButton>
      <NavButton onClick={onForward} disabled={!canGoFwd} title="Forward">
        <IconForward />
      </NavButton>
      <NavButton onClick={onRefresh} disabled={!swReady} title="Refresh">
        <IconRefresh />
      </NavButton>
      <NavButton onClick={onHome} disabled={!swReady} title="Home">
        <IconHome />
      </NavButton>

      <input
        type="text"
        value={activeTab.inputValue}
        onChange={(e) => onAddressChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        onFocus={(e) => e.target.select()}
        placeholder={
          swReady ? "https:// or search query..." : "Starting proxy..."
        }
        disabled={!swReady}
        spellCheck={false}
        autoComplete="off"
        style={{
          flex: 1,
          height: 28,
          border: "2px solid var(--color-ink)",
          boxShadow: "2px 2px 0 var(--color-ink)",
          padding: "0 8px",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--color-ink)",
          background: swReady ? "white" : "var(--bg-window)",
          outline: "none",
          minWidth: 0,
        }}
      />

      <button
        onClick={onSubmit}
        disabled={!swReady}
        className="btn"
        style={{
          height: 28,
          padding: "0 14px",
          background: "var(--color-accent)",
          border: "2px solid var(--color-ink)",
          boxShadow: "2px 2px 0 var(--color-ink)",
          color: "white",
          fontFamily: "var(--font-system)",
          fontSize: 18,
          cursor: swReady ? "pointer" : "not-allowed",
          opacity: swReady ? 1 : 0.5,
          flexShrink: 0,
          letterSpacing: "0.05em",
        }}
      >
        GO
      </button>
    </div>
  );
}
