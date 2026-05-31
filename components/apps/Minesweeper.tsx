/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useEffect, useReducer } from "react";

const ROWS = 9;
const COLS = 9;
const MINES = 10;
const CELL_SIZE = 32;

type CellState = "hidden" | "revealed" | "flagged";

interface Cell {
  isMine: boolean;
  state: CellState;
  adjacentMines: number;
}

type GameStatus = "idle" | "playing" | "won" | "lost";

interface GameState {
  board: Cell[][];
  status: GameStatus;
  flagsLeft: number;
  startTime: number | null;
  elapsed: number;
}

type Action =
  | { type: "REVEAL"; row: number; col: number }
  | { type: "FLAG"; row: number; col: number }
  | { type: "RESET" }
  | { type: "TICK" };

function buildBoard(firstRow: number, firstCol: number): Cell[][] {
  // Place mines avoiding the first click and its neighbors
  const safeZone = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = firstRow + dr;
      const c = firstCol + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        safeZone.add(`${r},${c}`);
      }
    }
  }

  const cells = ROWS * COLS - safeZone.size;
  const minesToPlace = Math.min(MINES, cells);
  const minePositions = new Set<string>();

  while (minePositions.size < minesToPlace) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    const key = `${r},${c}`;
    if (!safeZone.has(key)) minePositions.add(key);
  }

  const board: Cell[][] = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      isMine: minePositions.has(`${r},${c}`),
      state: "hidden",
      adjacentMines: 0,
    })),
  );

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < ROWS &&
            nc >= 0 &&
            nc < COLS &&
            board[nr][nc].isMine
          ) {
            count++;
          }
        }
      }
      board[r][c].adjacentMines = count;
    }
  }

  return board;
}

function floodReveal(board: Cell[][], row: number, col: number): Cell[][] {
  const next = board.map((r) => r.map((c) => ({ ...c })));
  const queue: [number, number][] = [[row, col]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = next[r][c];
    if (cell.state === "flagged" || cell.state === "revealed") continue;
    cell.state = "revealed";

    if (cell.adjacentMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < ROWS &&
            nc >= 0 &&
            nc < COLS &&
            !visited.has(`${nr},${nc}`)
          ) {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  return next;
}

function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) =>
      cell.isMine ? { ...cell, state: "revealed" } : { ...cell },
    ),
  );
}

function checkWin(board: Cell[][]): boolean {
  return board.every((row) =>
    row.every((cell) => cell.isMine || cell.state === "revealed"),
  );
}

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      state: "hidden" as CellState,
      adjacentMines: 0,
    })),
  );
}

function initialState(): GameState {
  return {
    board: emptyBoard(),
    status: "idle",
    flagsLeft: MINES,
    startTime: null,
    elapsed: 0,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "RESET":
      return initialState();

    case "TICK":
      if (state.status !== "playing" || state.startTime == null) return state;
      return {
        ...state,
        elapsed: Math.floor((Date.now() - state.startTime) / 1000),
      };

    case "FLAG": {
      const { row, col } = action;
      const cell = state.board[row][col];
      if (state.status === "lost" || state.status === "won") return state;
      if (cell.state === "revealed") return state;

      const board = state.board.map((r) => r.map((c) => ({ ...c })));
      if (cell.state === "hidden") {
        if (state.flagsLeft <= 0) return state;
        board[row][col].state = "flagged";
        return { ...state, board, flagsLeft: state.flagsLeft - 1 };
      } else {
        board[row][col].state = "hidden";
        return { ...state, board, flagsLeft: state.flagsLeft + 1 };
      }
    }

    case "REVEAL": {
      const { row, col } = action;
      if (state.status === "lost" || state.status === "won") return state;
      const cell = state.board[row][col];
      if (cell.state === "flagged" || cell.state === "revealed") return state;

      if (state.status === "idle") {
        const board = buildBoard(row, col);
        const revealed = floodReveal(board, row, col);
        const won = checkWin(revealed);
        return {
          ...state,
          board: revealed,
          status: won ? "won" : "playing",
          startTime: Date.now(),
          elapsed: 0,
        };
      }

      if (cell.isMine) {
        const board = revealAllMines(state.board);
        return { ...state, board, status: "lost" };
      }

      const board = floodReveal(state.board, row, col);
      const won = checkWin(board);
      return { ...state, board, status: won ? "won" : "playing" };
    }

    default:
      return state;
  }
}

function FaceSmiley() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <circle cx="10" cy="10" r="8" />
      <circle cx="7" cy="8" r="1" fill="var(--color-ink)" stroke="none" />
      <circle cx="13" cy="8" r="1" fill="var(--color-ink)" stroke="none" />
      <path d="M6 12 Q10 16 14 12" strokeLinecap="round" />
    </svg>
  );
}

function FaceWon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <circle cx="10" cy="10" r="8" />
      <rect x="5" y="6" width="4" height="3" />
      <rect x="11" y="6" width="4" height="3" />
      <line x1="9" y1="7.5" x2="11" y2="7.5" />
      <path d="M6 13 Q10 17 14 13" strokeLinecap="round" />
    </svg>
  );
}

function FaceLost() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <circle cx="10" cy="10" r="8" />
      <line x1="6" y1="7" x2="8" y2="9" />
      <line x1="8" y1="7" x2="6" y2="9" />
      <line x1="12" y1="7" x2="14" y2="9" />
      <line x1="14" y1="7" x2="12" y2="9" />
      <path d="M6 15 Q10 11 14 15" strokeLinecap="round" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <line x1="5" y1="2" x2="5" y2="16" />
      <polygon
        points="5,2 14,6 5,10"
        fill="var(--color-accent)"
        stroke="var(--color-accent)"
        strokeWidth="1"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function MineIcon({ exploded = false }: { exploded?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      strokeLinecap="square"
    >
      <line
        x1="9"
        y1="1"
        x2="9"
        y2="4"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="9"
        y1="14"
        x2="9"
        y2="17"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="1"
        y1="9"
        x2="4"
        y2="9"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="14"
        y1="9"
        x2="17"
        y2="9"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="3"
        y1="3"
        x2="5"
        y2="5"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="13"
        y1="13"
        x2="15"
        y2="15"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="15"
        y1="3"
        x2="13"
        y2="5"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="3"
        y1="15"
        x2="5"
        y2="13"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <circle
        cx="9"
        cy="9"
        r="4"
        fill={exploded ? "var(--color-accent)" : "var(--color-ink)"}
        stroke="none"
      />
    </svg>
  );
}

const NUM_COLORS: Record<number, string> = {
  1: "#0000ff",
  2: "#007b00",
  3: "#ff0000",
  4: "#000080",
  5: "#7b0000",
  6: "#008080",
  7: "#000000",
  8: "#808080",
};

export default function Minesweeper() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const tick = useCallback(() => dispatch({ type: "TICK" }), []);

  useEffect(() => {
    if (state.status !== "playing") return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.status, tick]);

  function handleReveal(row: number, col: number) {
    dispatch({ type: "REVEAL", row, col });
  }

  function handleFlag(e: React.MouseEvent, row: number, col: number) {
    e.preventDefault();
    dispatch({ type: "FLAG", row, col });
  }

  const FaceIcon =
    state.status === "won"
      ? FaceWon
      : state.status === "lost"
        ? FaceLost
        : FaceSmiley;

  return (
    <div
      data-no-ctx-menu
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--bg-desktop)",
        height: "100%",
        padding: "12px",
        gap: "10px",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        className="win-border"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: COLS * CELL_SIZE + 4 + "px",
          padding: "6px 10px",
          background: "var(--bg-window)",
        }}
      >
        {/* Flags left */}
        <div
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "24px",
            color: "var(--color-accent)",
            minWidth: "40px",
            textAlign: "right",
          }}
        >
          {String(state.flagsLeft).padStart(3, "0")}
        </div>

        {/* Face button */}
        <button
          onClick={() => dispatch({ type: "RESET" })}
          aria-label="New game"
          style={{
            fontSize: "22px",
            width: "34px",
            height: "34px",
            border: "2px solid var(--color-ink)",
            background: "var(--bg-window)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "2px 2px 0 var(--color-ink)",
          }}
        >
          <FaceIcon />
        </button>

        {/* Timer */}
        <div
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "24px",
            color: "var(--color-accent)",
            minWidth: "40px",
          }}
        >
          {String(Math.min(state.elapsed, 999)).padStart(3, "0")}
        </div>
      </div>

      {/* Board */}
      <div
        className="win-border"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
          background: "var(--bg-window)",
        }}
        role="grid"
        aria-label="Minesweeper board"
      >
        {state.board.map((row, r) =>
          row.map((cell, c) => {
            const isRevealed = cell.state === "revealed";
            const isFlagged = cell.state === "flagged";
            const isMineLoss =
              isRevealed && cell.isMine && state.status === "lost";

            return (
              <button
                key={`${r}-${c}`}
                role="gridcell"
                aria-label={
                  isFlagged
                    ? "Flagged"
                    : isRevealed
                      ? cell.isMine
                        ? "Mine"
                        : cell.adjacentMines > 0
                          ? String(cell.adjacentMines)
                          : "Empty"
                      : "Hidden"
                }
                onClick={() => handleReveal(r, c)}
                onContextMenu={(e) => handleFlag(e, r, c)}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  border: isRevealed
                    ? "1px solid rgba(0,0,0,0.15)"
                    : "2px solid var(--color-ink)",
                  background: isMineLoss
                    ? "var(--color-accent)"
                    : isRevealed
                      ? "var(--bg-window)"
                      : "var(--color-muted)",
                  cursor: isRevealed ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-system)",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color:
                    isRevealed && !cell.isMine
                      ? (NUM_COLORS[cell.adjacentMines] ?? "transparent")
                      : "var(--color-ink)",
                  boxShadow: isRevealed
                    ? "none"
                    : "inset -1px -1px 0 rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                {isFlagged && <FlagIcon />}
                {isRevealed && cell.isMine && (
                  <MineIcon exploded={isMineLoss} />
                )}
                {isRevealed &&
                  !cell.isMine &&
                  cell.adjacentMines > 0 &&
                  cell.adjacentMines}
              </button>
            );
          }),
        )}
      </div>

      {/* Status */}
      {(state.status === "won" || state.status === "lost") && (
        <div
          style={{
            fontFamily: "var(--font-system)",
            fontSize: "18px",
            color:
              state.status === "won"
                ? "var(--color-teal)"
                : "var(--color-accent)",
          }}
        >
          {state.status === "won"
            ? "You win! Click the face to play again."
            : "Game over. Click the face to try again."}
        </div>
      )}
      {state.status === "idle" && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--color-muted)",
          }}
        >
          Left-click to reveal, Right-click to flag
        </div>
      )}
    </div>
  );
}
