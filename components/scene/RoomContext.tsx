/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { createContext, useContext } from "react";

export const EGG_IDS = [
  "lamp-tantrum",
  "radio-dj",
  "note-left",
  "note-right",
  "tv-zapper",
  "trickshot",
] as const;

export type EggId = (typeof EGG_IDS)[number];
export type PaperSide = "left" | "right";

export interface RoomApi {
  hour: number;
  lampGlow: number;
  onLampClick: () => void;
  musicOn: boolean;
  toggleMusic: () => void;
  openPaper: (side: PaperSide) => void;
  unlockEgg: (id: EggId) => void;
  startTimeLapse: () => void;
  raining: boolean;
  celebrating: boolean;
  toggleParty: () => void;
  eggsFound: number;
  eggsTotal: number;
}

export const RoomContext = createContext<RoomApi | null>(null);

export function useRoom(): RoomApi {
  const api = useContext(RoomContext);
  if (!api) throw new Error("useRoom outside RoomContext");
  return api;
}
