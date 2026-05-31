/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { S } from "../constants";

interface MenuPhaseProps {
  error: string;
  loading: boolean;
  joinInput: string;
  onJoinInputChange: (val: string) => void;
  onCreate: () => void;
  onJoin: () => void;
}

export default function MenuPhase({
  error,
  loading,
  joinInput,
  onJoinInputChange,
  onCreate,
  onJoin,
}: MenuPhaseProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "420px",
        alignSelf: "center",
        paddingTop: "16px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-system)",
            color: "var(--color-muted)",
            letterSpacing: "0.1em",
            marginBottom: "4px",
          }}
        >
          TWO PLAYER GAME
        </div>
        <div
          style={{
            fontSize: "22px",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.05em",
          }}
        >
          NAVAL COMBAT
        </div>
      </div>

      {error && (
        <div
          style={{
            fontSize: "14px",
            fontFamily: "var(--font-body)",
            color: "var(--color-accent)",
            padding: "6px 10px",
            border: "1px solid var(--color-accent)",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "12px", ...S.label() }}>CREATE A NEW ROOM</div>
        <button
          className="btn"
          style={S.btn(true)}
          onClick={onCreate}
          disabled={loading}
        >
          {loading ? "..." : "NEW GAME"}
        </button>
      </div>

      <hr style={S.divider} />

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "12px", ...S.label() }}>
          JOIN AN EXISTING ROOM
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            style={S.input}
            placeholder="CODE"
            maxLength={4}
            value={joinInput}
            onChange={(e) => onJoinInputChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && onJoin()}
          />
          <button
            className="btn"
            style={S.btn()}
            onClick={onJoin}
            disabled={loading || joinInput.length !== 4}
          >
            JOIN
          </button>
        </div>
      </div>
    </div>
  );
}
