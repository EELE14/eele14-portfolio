/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { btnBase } from "@/components/ui/ToolbarRow";

interface RepoToolbarProps {
  canBack: boolean;
  canFwd: boolean;
  canUp: boolean;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  addressInput: string;
  onAddressChange: (v: string) => void;
  onAddressSubmit: (e: React.FormEvent) => void;
}

export default function RepoToolbar({
  canBack,
  canFwd,
  canUp,
  onBack,
  onForward,
  onUp,
  addressInput,
  onAddressChange,
  onAddressSubmit,
}: RepoToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 6px",
        borderBottom: "1px solid var(--color-ink)",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onBack}
        disabled={!canBack}
        aria-label="Back"
        style={btnBase(canBack)}
      >
        ←
      </button>
      <button
        onClick={onForward}
        disabled={!canFwd}
        aria-label="Forward"
        style={btnBase(canFwd)}
      >
        →
      </button>
      <button
        onClick={onUp}
        disabled={!canUp}
        aria-label="Up"
        style={btnBase(canUp)}
      >
        ↑
      </button>
      <form
        onSubmit={onAddressSubmit}
        style={{ flex: 1, display: "flex", gap: "4px", marginLeft: "4px" }}
      >
        <label
          htmlFor="repo-addr"
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "15px",
            alignSelf: "center",
            whiteSpace: "nowrap",
          }}
        >
          Address:
        </label>
        <input
          id="repo-addr"
          value={addressInput}
          onChange={(e) => onAddressChange(e.target.value)}
          style={{
            flex: 1,
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            border: "2px solid var(--color-ink)",
            padding: "1px 6px",
            background: "white",
            color: "var(--color-ink)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{ ...btnBase(true), border: "1px solid var(--color-ink)" }}
        >
          Go
        </button>
      </form>
    </div>
  );
}
