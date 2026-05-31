/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { S } from "../constants";

interface LobbyPhaseProps {
  roomCode: string;
  onCancel: () => void;
}

export default function LobbyPhase({ roomCode, onCancel }: LobbyPhaseProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "flex-start",
      }}
    >
      <div style={{ fontSize: "12px", ...S.label() }}>
        SHARE THIS CODE WITH YOUR OPPONENT
      </div>
      <div style={S.code}>{roomCode}</div>
      <div
        style={{
          fontSize: "15px",
          fontFamily: "var(--font-body)",
          color: "var(--color-muted)",
        }}
      >
        Waiting for opponent to connect...
      </div>
      <div
        style={{
          fontSize: "13px",
          fontFamily: "var(--font-body)",
          color: "var(--color-muted)",
          opacity: 0.6,
        }}
      >
        The game will begin automatically when they join.
      </div>
      <button
        className="btn"
        style={{ ...S.btn(), marginTop: "8px" }}
        onClick={onCancel}
      >
        CANCEL
      </button>
    </div>
  );
}
