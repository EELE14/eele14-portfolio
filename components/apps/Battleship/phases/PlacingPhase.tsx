/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useState, useMemo, useCallback } from "react";
import {
  SHIP_DEFS,
  type PlacedShip,
  type ClientRoom,
} from "@/lib/server/battleship";
import type { Dispatch, SetStateAction } from "react";
import { S, COLS, CELL } from "../constants";

function calcPreview(
  shipId: string,
  orientation: "h" | "v",
  hoverRow: number,
  hoverCol: number,
  placed: Map<string, PlacedShip>,
): { cells: [number, number][]; valid: boolean } {
  const def = SHIP_DEFS.find((d) => d.id === shipId);
  if (!def) return { cells: [], valid: false };

  const cells: [number, number][] = Array.from({ length: def.size }, (_, i) => [
    orientation === "v" ? hoverRow + i : hoverRow,
    orientation === "h" ? hoverCol + i : hoverCol,
  ]);

  if (cells.some(([r, c]) => r < 0 || r > 9 || c < 0 || c > 9)) {
    return { cells, valid: false };
  }

  const occupied = new Set<string>();
  for (const [id, ship] of placed) {
    if (id === shipId) continue;
    for (const [r, c] of ship.cells) occupied.add(`${r},${c}`);
  }

  if (cells.some(([r, c]) => occupied.has(`${r},${c}`))) {
    return { cells, valid: false };
  }

  return { cells, valid: true };
}

interface PlacingPhaseProps {
  gameRoom: ClientRoom;
  placedShips: Map<string, PlacedShip>;
  setPlacedShips: Dispatch<SetStateAction<Map<string, PlacedShip>>>;
  isReady: boolean;
  loading: boolean;
  onReady: () => void;
}

export default function PlacingPhase({
  gameRoom,
  placedShips,
  setPlacedShips,
  isReady,
  loading,
  onReady,
}: PlacingPhaseProps) {
  const [selectedShip, setSelectedShip] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"h" | "v">("h");
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  const allPlaced = useMemo(
    () => SHIP_DEFS.every((def) => placedShips.has(def.id)),
    [placedShips],
  );

  const preview = useMemo(() => {
    if (!selectedShip || !hoverCell) return null;
    return calcPreview(
      selectedShip,
      orientation,
      hoverCell[0],
      hoverCell[1],
      placedShips,
    );
  }, [selectedShip, orientation, hoverCell, placedShips]);

  const previewSet = useMemo(() => {
    if (!preview) return new Map<string, boolean>();
    const m = new Map<string, boolean>();
    for (const [r, c] of preview.cells) m.set(`${r},${c}`, preview.valid);
    return m;
  }, [preview]);

  const placedCells = useMemo(() => {
    const m = new Map<string, string>();
    for (const [id, ship] of placedShips) {
      for (const [r, c] of ship.cells) m.set(`${r},${c}`, id);
    }
    return m;
  }, [placedShips]);

  const handleClick = useCallback(
    (row: number, col: number) => {
      if (isReady) return;

      if (!selectedShip) {
        for (const [id, ship] of placedShips) {
          if (ship.cells.some(([r, c]) => r === row && c === col)) {
            setPlacedShips((prev) => {
              const n = new Map(prev);
              n.delete(id);
              return n;
            });
            return;
          }
        }
        return;
      }

      const p = calcPreview(selectedShip, orientation, row, col, placedShips);
      if (!p.valid) return;

      const def = SHIP_DEFS.find((d) => d.id === selectedShip)!;
      const ship: PlacedShip = {
        id: selectedShip,
        size: def.size,
        cells: p.cells,
      };

      const nextMap = new Map(placedShips).set(selectedShip, ship);
      const nextUnplaced = SHIP_DEFS.find((d) => !nextMap.has(d.id));
      setPlacedShips(nextMap);
      setSelectedShip(nextUnplaced?.id ?? null);
    },
    [isReady, selectedShip, orientation, placedShips, setPlacedShips],
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* Ship list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          minWidth: "170px",
        }}
      >
        <div style={{ fontSize: "12px", ...S.label(), marginBottom: "4px" }}>
          {isReady ? "BOARD SUBMITTED — WAITING" : "SELECT A SHIP TO PLACE"}
        </div>

        {SHIP_DEFS.map((def) => {
          const placed = placedShips.has(def.id);
          const active = selectedShip === def.id;
          return (
            <div
              key={def.id}
              style={{
                ...S.shipRow,
                border: active
                  ? "1px solid var(--color-ink)"
                  : "1px solid transparent",
                background: active ? "rgba(0,0,0,0.06)" : "transparent",
                opacity: isReady ? 0.6 : 1,
                cursor: isReady ? "default" : "pointer",
              }}
              onClick={() => {
                if (isReady) return;
                setSelectedShip(active ? null : def.id);
              }}
            >
              <div style={S.shipBar(def.size, active, placed)}>
                {Array.from({ length: def.size }).map((_, i) => (
                  <div key={i} style={S.shipBlock(active)} />
                ))}
              </div>
              <span
                style={{
                  fontSize: "14px",
                  fontFamily: "var(--font-system)",
                  color: placed ? "var(--color-muted)" : "var(--color-ink)",
                  letterSpacing: "0.03em",
                }}
              >
                {def.name}
                {placed && " ✓"}
              </span>
            </div>
          );
        })}

        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {!isReady && (
            <button
              className="btn"
              style={S.btn()}
              onClick={() => setOrientation((o) => (o === "h" ? "v" : "h"))}
            >
              [{orientation === "h" ? "HORIZ" : "VERT"}]
            </button>
          )}
          {!isReady && (
            <button
              className="btn"
              style={S.btn()}
              onClick={() => {
                setPlacedShips(new Map());
                setSelectedShip(SHIP_DEFS[0].id);
              }}
              disabled={placedShips.size === 0}
            >
              CLEAR
            </button>
          )}
          <button
            className="btn"
            style={S.btn(true)}
            onClick={onReady}
            disabled={!allPlaced || isReady || loading}
          >
            {isReady ? "SUBMITTED" : loading ? "..." : "READY"}
          </button>
        </div>

        {gameRoom.opponentReady && !isReady && (
          <div
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-body)",
              color: "var(--color-teal)",
              marginTop: "4px",
            }}
          >
            Opponent is ready.
          </div>
        )}
      </div>

      {/* Placement grid */}
      <div style={S.gridWrap} onMouseLeave={() => setHoverCell(null)}>
        <div style={S.row}>
          <div style={S.headerCell} />
          {COLS.map((c) => (
            <div key={c} style={S.headerCell}>
              {c}
            </div>
          ))}
        </div>
        {Array.from({ length: 10 }, (_, r) => (
          <div key={r} style={S.row}>
            <div style={S.headerCell}>{r + 1}</div>
            {Array.from({ length: 10 }, (_, c) => {
              const key = `${r},${c}`;
              const shipId = placedCells.get(key) ?? null;
              const pv = previewSet.has(key)
                ? ((previewSet.get(key) ? "valid" : "invalid") as
                    | "valid"
                    | "invalid")
                : null;
              return (
                <div
                  key={c}
                  onClick={() => handleClick(r, c)}
                  onMouseEnter={() => setHoverCell([r, c])}
                  style={{
                    width: `${CELL}px`,
                    height: `${CELL}px`,
                    background:
                      pv === "valid"
                        ? "var(--color-teal)"
                        : pv === "invalid"
                          ? "var(--color-accent)"
                          : shipId
                            ? "var(--bg-titlebar)"
                            : "transparent",
                    border: `1px solid ${shipId || pv ? "var(--color-ink)" : "var(--color-muted)"}`,
                    cursor: isReady
                      ? "default"
                      : selectedShip
                        ? pv === "invalid"
                          ? "not-allowed"
                          : "crosshair"
                        : shipId
                          ? "pointer"
                          : "default",
                    flexShrink: 0,
                    transition: "background 60ms",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
