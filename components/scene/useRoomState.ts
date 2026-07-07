/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EGG_IDS,
  type EggId,
  type PaperSide,
  type RoomApi,
} from "./RoomContext";
import { startLofi, stopLofi } from "./lofi";
import { lightingForHour } from "./lighting";
import { sfxLampFlicker, sfxPaper, sfxSwitch } from "./sfx";

const EGGS_KEY = "eele14-eggs";
const FLICKER_PATTERN = [0, 1, 0, 0.35, 0, 1, 0.15, 1];
const FLICKER_STEP_MS = 90;

function storedEggs(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(EGGS_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function useRoomState(
  hour: number,
  startTimeLapse: () => void,
): {
  roomApi: RoomApi;
  paper: PaperSide | null;
  closePaper: () => void;
} {
  const [lampOn, setLampOn] = useState(true);
  const [flickerMul, setFlickerMul] = useState(1);
  const lampClicks = useRef<number[]>([]);
  const flickering = useRef(false);
  const [musicOn, setMusicOn] = useState(false);
  const [paper, setPaper] = useState<PaperSide | null>(null);
  const [eggs, setEggs] = useState<string[]>(storedEggs);

  const unlockEgg = useCallback((id: EggId) => {
    setEggs((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(EGGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const runFlicker = useCallback(() => {
    flickering.current = true;
    sfxLampFlicker();
    FLICKER_PATTERN.forEach((value, i) => {
      setTimeout(() => setFlickerMul(value), i * FLICKER_STEP_MS);
    });
    setTimeout(() => {
      setFlickerMul(1);
      flickering.current = false;
    }, FLICKER_PATTERN.length * FLICKER_STEP_MS);
  }, []);

  const onLampClick = useCallback(() => {
    if (flickering.current) return;
    const now = performance.now();
    lampClicks.current = [
      ...lampClicks.current.filter((t) => now - t < 1500),
      now,
    ];
    if (lampClicks.current.length >= 5) {
      lampClicks.current = [];
      setLampOn(true);
      runFlicker();
      unlockEgg("lamp-tantrum");
      return;
    }
    sfxSwitch(!lampOn);
    setLampOn(!lampOn);
  }, [lampOn, runFlicker, unlockEgg]);

  const toggleMusic = useCallback(() => {
    sfxSwitch(!musicOn);
    if (musicOn) stopLofi();
    else {
      startLofi();
      unlockEgg("radio-dj");
    }
    setMusicOn(!musicOn);
  }, [musicOn, unlockEgg]);

  useEffect(() => stopLofi, []);

  const openPaper = useCallback(
    (side: PaperSide) => {
      sfxPaper();
      setPaper(side);
      unlockEgg(side === "left" ? "note-left" : "note-right");
    },
    [unlockEgg],
  );

  const closePaper = useCallback(() => {
    sfxPaper();
    setPaper(null);
  }, []);

  const roomApi = useMemo(
    () => ({
      hour,
      lampGlow: (lampOn ? lightingForHour(hour).lampIntensity : 0) * flickerMul,
      onLampClick,
      musicOn,
      toggleMusic,
      openPaper,
      unlockEgg,
      startTimeLapse,
      eggsFound: eggs.length,
      eggsTotal: EGG_IDS.length,
    }),
    [
      hour,
      lampOn,
      flickerMul,
      onLampClick,
      musicOn,
      toggleMusic,
      openPaper,
      unlockEgg,
      startTimeLapse,
      eggs,
    ],
  );

  return { roomApi, paper, closePaper };
}
