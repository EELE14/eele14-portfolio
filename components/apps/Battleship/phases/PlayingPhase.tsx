/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ClientRoom } from "@/lib/server/battleship";
import { S, COLS } from "../constants";
import GameCell from "../components/GameCell";
import ShipStatus from "../components/ShipStatus";

interface PlayingPhaseProps {
  gameRoom: ClientRoom;
  isMyTurn: boolean;
  loading: boolean;
  onFire: (row: number, col: number) => void;
}

export default function PlayingPhase({
  gameRoom,
  isMyTurn,
  loading,
  onFire,
}: PlayingPhaseProps) {
  function renderBoard(
    board: ClientRoom["myBoard"] | ClientRoom["opponentBoard"],
    isAttack: boolean,
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
            {row.map((c, col) => {
              const clickable = isAttack && isMyTurn && !c.hit && !loading;
              return (
                <GameCell
                  key={col}
                  hasShip={c.hasShip}
                  hit={c.hit}
                  clickable={clickable}
                  onClick={() => isAttack && onFire(r, col)}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "12px", ...S.label() }}>MY FLEET</div>
        {renderBoard(gameRoom.myBoard, false)}
        <div style={{ marginTop: "4px" }}>
          <ShipStatus label="STATUS" sunk={gameRoom.mySunkShips} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "12px", ...S.label() }}>
          {isMyTurn ? "OPPONENT SEA — CLICK TO FIRE" : "OPPONENT SEA"}
        </div>
        {renderBoard(gameRoom.opponentBoard, true)}
        <div style={{ marginTop: "4px" }}>
          <ShipStatus label="ENEMY LOSSES" sunk={gameRoom.opponentSunkShips} />
        </div>
      </div>
    </div>
  );
}
