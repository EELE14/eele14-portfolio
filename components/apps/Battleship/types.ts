/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { PlacedShip } from "@/lib/server/battleship";

export type UIPhase = "menu" | "lobby" | "placing" | "playing" | "finished";

export type ClientMessage =
  | { type: "ready"; ships: PlacedShip[] }
  | { type: "fire"; row: number; col: number };
