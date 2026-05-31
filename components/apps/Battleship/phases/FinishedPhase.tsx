/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ClientRoom } from "@/lib/server/battleship";
import { S, COLS } from "../constants";
import GameCell from "../components/GameCell";

interface FinishedPhaseProps {
  gameRoom: ClientRoom;
  onReset: () => void;
}

export default function FinishedPhase({
  gameRoom,
  onReset,
}: FinishedPhaseProps) {
  const won = gameRoom.winner === gameRoom.playerIndex;

  function renderGrid(
    board: ClientRoom["myBoard"] | ClientRoom["opponentBoard"],
  ) {
    return (
      <div style={S.gridWrap}>
        <div style={S.row}>
          <div style={S.headerCell} />
          {COLS.map((c) => (
            <div key={c} style={S.headerCell}>
              {c}
            </div>
          ))}
        </div>
        {board.map((row, r) => (
          <div key={r} style={S.row}>
            <div style={S.headerCell}>{r + 1}</div>
            {row.map((c, col) => (
              <GameCell key={col} hasShip={c.hasShip} hit={c.hit} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          fontFamily: "var(--font-display)",
          color: won ? "var(--color-teal)" : "var(--color-accent)",
          letterSpacing: "0.1em",
        }}
      >
        {won ? "VICTORY" : "DEFEAT"}
      </div>
      <div
        style={{
          fontSize: "14px",
          fontFamily: "var(--font-body)",
          color: "var(--color-muted)",
        }}
      >
        {won
          ? "All enemy ships have been sunk."
          : "Your fleet has been destroyed."}
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "12px", ...S.label() }}>MY FLEET</div>
          {renderGrid(gameRoom.myBoard)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "12px", ...S.label() }}>ENEMY FLEET</div>
          {renderGrid(gameRoom.opponentBoard)}
        </div>
      </div>

      <button className="btn" style={S.btn(true)} onClick={onReset}>
        PLAY AGAIN
      </button>
    </div>
  );
}
