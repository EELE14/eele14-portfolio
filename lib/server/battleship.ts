/* Copyright (c) 2026 eele14. All Rights Reserved. */

export type Phase = "waiting" | "placing" | "playing" | "finished";

export interface Cell {
  shipId: string | null;
  hit: boolean;
}

export interface PlacedShip {
  id: string;
  size: number;
  cells: [number, number][]; // [row, col] pairs
}

export interface PlayerState {
  id: string;
  board: Cell[][];
  ships: PlacedShip[];
  ready: boolean;
  sunkShips: string[];
}

export interface Room {
  code: string;
  players: [PlayerState, PlayerState | null];
  phase: Phase;
  turn: 0 | 1;
  winner: 0 | 1 | null;
  createdAt: number;
  lastActivity: number;
}

export interface ClientCell {
  hasShip: boolean;
  hit: boolean;
}

export interface ClientRoom {
  code: string;
  phase: Phase;
  playerIndex: 0 | 1;
  myBoard: ClientCell[][];
  opponentBoard: ClientCell[][];
  myShips: PlacedShip[];
  myReady: boolean;
  opponentReady: boolean;
  turn: 0 | 1;
  winner: 0 | 1 | null;
  opponentConnected: boolean;
  mySunkShips: string[];
  opponentSunkShips: string[];
}

export type GameEvent =
  | { type: "room_state"; room: ClientRoom }
  | { type: "opponent_joined" }
  | { type: "opponent_ready" }
  | { type: "game_start"; turn: 0 | 1; room: ClientRoom }
  | {
      type: "move_result";
      row: number;
      col: number;
      hit: boolean;
      sunk: string | null;
      turn: 0 | 1;
      room: ClientRoom;
    }
  | { type: "game_over"; winner: 0 | 1; room: ClientRoom }
  | { type: "opponent_left" }
  | { type: "opponent_rejoined" }
  | { type: "error"; message: string };

export const SHIP_DEFS = [
  { id: "carrier", name: "CARRIER", size: 5 },
  { id: "battleship", name: "BATTLESHIP", size: 4 },
  { id: "cruiser", name: "CRUISER", size: 3 },
  { id: "submarine", name: "SUBMARINE", size: 3 },
  { id: "destroyer", name: "DESTROYER", size: 2 },
] as const;

export type ShipId = (typeof SHIP_DEFS)[number]["id"];

import type { WebSocket } from "ws";

declare global {
  var __bs_rooms: Map<string, Room> | undefined;
  var __bs_subs: Map<string, Map<string, WebSocket>> | undefined;
  var __bs_timers: Map<string, ReturnType<typeof setTimeout>> | undefined;
}

const rooms = (globalThis.__bs_rooms ??= new Map<string, Room>());
const subscribers = (globalThis.__bs_subs ??= new Map<
  string,
  Map<string, WebSocket>
>());
const disconnectTimers = (globalThis.__bs_timers ??= new Map<
  string,
  ReturnType<typeof setTimeout>
>());

function cleanup() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const age = now - room.lastActivity;
    const maxAge = room.phase === "finished" ? 5 * 60_000 : 30 * 60_000;
    if (age > maxAge) {
      rooms.delete(code);
      subscribers.delete(code);
    }
  }
}

function makeBoard(): Cell[][] {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ shipId: null, hit: false })),
  );
}

function makePlayer(id: string): PlayerState {
  return { id, board: makeBoard(), ships: [], ready: false, sunkShips: [] };
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
function generateCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 12);
}

export function validateBoard(ships: PlacedShip[]): string | null {
  const requiredIds = new Set(SHIP_DEFS.map((s) => s.id));
  const placedIds = new Set(ships.map((s) => s.id));

  for (const id of requiredIds) {
    if (!placedIds.has(id)) return `Missing ship: ${id}`;
  }
  if (ships.length !== SHIP_DEFS.length) return "Duplicate ships detected";

  const occupied = new Set<string>();
  for (const ship of ships) {
    const def = SHIP_DEFS.find((d) => d.id === ship.id);
    if (!def) return `Unknown ship: ${ship.id}`;
    if (ship.cells.length !== def.size) return `Wrong size for ${ship.id}`;

    for (const [r, c] of ship.cells) {
      if (r < 0 || r > 9 || c < 0 || c > 9) return "Ship out of bounds";
      const key = `${r},${c}`;
      if (occupied.has(key)) return "Ships overlap";
      occupied.add(key);
    }
  }

  return null;
}

export function createRoom(): { code: string; playerId: string } {
  cleanup();
  const code = generateCode();
  const playerId = randomId();
  const room: Room = {
    code,
    players: [makePlayer(playerId), null],
    phase: "waiting",
    turn: 0,
    winner: null,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  return { code, playerId };
}

export function joinRoom(
  code: string,
): { playerId: string } | { error: string } {
  const upper = code.toUpperCase();
  const room = rooms.get(upper);
  if (!room) return { error: "Room not found" };
  if (room.players[1] !== null) return { error: "Room is full" };
  if (room.phase !== "waiting") return { error: "Game already started" };

  const playerId = randomId();
  room.players[1] = makePlayer(playerId);
  room.phase = "placing";
  room.lastActivity = Date.now();

  sendToPlayer(upper, room.players[0].id, { type: "opponent_joined" });

  return { playerId };
}

export function submitBoard(
  code: string,
  playerId: string,
  ships: PlacedShip[],
): { ok: true } | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "placing") return { error: "Not in placement phase" };

  const playerIdx = room.players.findIndex((p) => p?.id === playerId) as
    | 0
    | 1
    | -1;
  if (playerIdx === -1) return { error: "Player not in room" };

  const validationError = validateBoard(ships);
  if (validationError) return { error: validationError };

  const player = room.players[playerIdx]!;
  player.board = makeBoard();
  player.ships = ships;
  for (const ship of ships) {
    for (const [r, c] of ship.cells) {
      player.board[r][c].shipId = ship.id;
    }
  }
  player.ready = true;
  room.lastActivity = Date.now();

  const opponentIdx = (playerIdx === 0 ? 1 : 0) as 0 | 1;
  const opponent = room.players[opponentIdx];
  if (opponent) {
    sendToPlayer(code, opponent.id, { type: "opponent_ready" });
  }

  if (room.players[0].ready && room.players[1]?.ready) {
    room.phase = "playing";
    room.turn = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    for (let i = 0; i < 2; i++) {
      const p = room.players[i];
      if (p) {
        sendToPlayer(code, p.id, {
          type: "game_start",
          turn: room.turn,
          room: getClientRoom(room, p.id),
        });
      }
    }
  }

  return { ok: true };
}

export function fireShot(
  code: string,
  playerId: string,
  row: number,
  col: number,
): { hit: boolean; sunk: string | null; turn: 0 | 1 } | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "playing") return { error: "Game not in progress" };

  const playerIdx = room.players.findIndex((p) => p?.id === playerId) as
    | 0
    | 1
    | -1;
  if (playerIdx === -1) return { error: "Player not in room" };
  if (room.turn !== playerIdx) return { error: "Not your turn" };
  if (row < 0 || row > 9 || col < 0 || col > 9)
    return { error: "Invalid coordinates" };

  const opponentIdx = (playerIdx === 0 ? 1 : 0) as 0 | 1;
  const opponent = room.players[opponentIdx]!;
  const cell = opponent.board[row][col];

  if (cell.hit) return { error: "Already fired here" };

  cell.hit = true;
  room.lastActivity = Date.now();

  const hit = cell.shipId !== null;
  let sunk: string | null = null;

  if (hit) {
    const shipId = cell.shipId!;
    const ship = opponent.ships.find((s) => s.id === shipId)!;
    const isSunk = ship.cells.every(([r, c]) => opponent.board[r][c].hit);
    if (isSunk) {
      sunk = shipId;
      opponent.sunkShips.push(shipId);
    }
  }

  const allSunk = opponent.sunkShips.length === SHIP_DEFS.length;

  if (allSunk) {
    room.phase = "finished";
    room.winner = playerIdx as 0 | 1;
    for (let i = 0; i < 2; i++) {
      const p = room.players[i];
      if (p) {
        const clientRoom = getClientRoom(room, p.id);
        sendToPlayer(code, p.id, {
          type: "game_over",
          winner: playerIdx as 0 | 1,
          room: clientRoom,
        });
      }
    }
    return { hit, sunk, turn: room.turn };
  }

  if (!hit) {
    room.turn = opponentIdx;
  }

  for (let i = 0; i < 2; i++) {
    const p = room.players[i];
    if (p) {
      const clientRoom = getClientRoom(room, p.id);
      sendToPlayer(code, p.id, {
        type: "move_result",
        row,
        col,
        hit,
        sunk,
        turn: room.turn,
        room: clientRoom,
      });
    }
  }

  return { hit, sunk, turn: room.turn };
}

export function getClientRoom(room: Room, playerId: string): ClientRoom {
  const playerIdx = room.players.findIndex((p) => p?.id === playerId);
  if (playerIdx === -1) throw new Error("Player not in room");

  const opponentIdx = playerIdx === 0 ? 1 : 0;
  const me = room.players[playerIdx]!;
  const opponent = room.players[opponentIdx];

  const myBoard: ClientCell[][] = me.board.map((row) =>
    row.map((cell) => ({ hasShip: cell.shipId !== null, hit: cell.hit })),
  );

  const gameOver = room.phase === "finished";
  const opponentBoard: ClientCell[][] = opponent
    ? opponent.board.map((row) =>
        row.map((cell) => ({
          hasShip: gameOver
            ? cell.shipId !== null
            : cell.hit && cell.shipId !== null,
          hit: cell.hit,
        })),
      )
    : Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, () => ({ hasShip: false, hit: false })),
      );

  return {
    code: room.code,
    phase: room.phase,
    playerIndex: playerIdx as 0 | 1,
    myBoard,
    opponentBoard,
    myShips: me.ships,
    myReady: me.ready,
    opponentReady: opponent?.ready ?? false,
    turn: room.turn,
    winner: room.winner,
    opponentConnected: opponent !== null && isOnline(room.code, opponent.id),
    mySunkShips: me.sunkShips,
    opponentSunkShips: opponent?.sunkShips ?? [],
  };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function subscribe(code: string, playerId: string, ws: WebSocket): void {
  if (!subscribers.has(code)) {
    subscribers.set(code, new Map());
  }

  const timerKey = `${code}:${playerId}`;
  const existing = disconnectTimers.get(timerKey);
  if (existing) {
    clearTimeout(existing);
    disconnectTimers.delete(timerKey);
  }

  const wasOnline = subscribers.get(code)!.has(playerId);
  subscribers.get(code)!.set(playerId, ws);

  const room = rooms.get(code);
  if (!room) {
    send(ws, { type: "error", message: "Room not found or expired" });
    return;
  }

  const player = room.players.find((p) => p?.id === playerId);
  if (!player) {
    send(ws, { type: "error", message: "Player not in room" });
    return;
  }

  send(ws, { type: "room_state", room: getClientRoom(room, playerId) });

  if (!wasOnline && room.phase !== "finished") {
    const opponentIdx =
      room.players.findIndex((p) => p?.id === playerId) === 0 ? 1 : 0;
    const opponent = room.players[opponentIdx];
    if (opponent) {
      sendToPlayer(code, opponent.id, { type: "opponent_rejoined" });
    }
  }
}

export function unsubscribe(code: string, playerId: string): void {
  subscribers.get(code)?.delete(playerId);

  const room = rooms.get(code);
  if (!room || room.phase === "finished") return;

  const timerKey = `${code}:${playerId}`;
  const timer = setTimeout(() => {
    disconnectTimers.delete(timerKey);
    if (subscribers.get(code)?.has(playerId)) return;

    const currentRoom = rooms.get(code);
    if (!currentRoom || currentRoom.phase === "finished") return;

    const playerIdx = currentRoom.players.findIndex((p) => p?.id === playerId);
    const opponentIdx = playerIdx === 0 ? 1 : 0;
    const opponent = currentRoom.players[opponentIdx];
    if (opponent) {
      sendToPlayer(code, opponent.id, { type: "opponent_left" });
    }
  }, 3000);

  disconnectTimers.set(timerKey, timer);
}

export function isOnline(code: string, playerId: string): boolean {
  return subscribers.get(code)?.has(playerId) ?? false;
}

function send(ws: WebSocket, event: GameEvent): void {
  if (ws.readyState === 1 /* OPEN */) {
    try {
      ws.send(JSON.stringify(event));
    } catch {
      // socket already closed
    }
  }
}

function sendToPlayer(code: string, playerId: string, event: GameEvent): void {
  const controller = subscribers.get(code)?.get(playerId);
  if (controller) send(controller, event);
}
