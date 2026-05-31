/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { useCallback, useEffect, useRef } from "react";
import type { UIPhase } from "../types";

const MUSIC: Partial<Record<UIPhase, string>> = {
  menu: "/sfx/Battleship/title-screen.mp3",
  lobby: "/sfx/Battleship/set-up-theme.mp3",
  placing: "/sfx/Battleship/set-up-theme.mp3",
  playing: "/sfx/Battleship/battle-music.mp3",
};

const SFX = {
  hit: "/sfx/Battleship/mine.mp3",
  miss: "/sfx/Battleship/miss.wav",
  win: "/sfx/Battleship/win-theme.mp3",
  lose: "/sfx/Battleship/lose-theme.mp3",
} as const;

export type SfxKey = keyof typeof SFX;

export function useAudio(
  phase: UIPhase,
  volume: number,
): (key: SfxKey) => void {
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const bgSrcRef = useRef<string | null>(null);

  useEffect(() => {
    const src = MUSIC[phase] ?? null;
    if (src === bgSrcRef.current) return;

    bgRef.current?.pause();
    bgSrcRef.current = src;

    if (!src) {
      bgRef.current = null;
      return;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume * 0.01;
    void audio.play().catch(() => {});
    bgRef.current = audio;

    return () => {
      audio.pause();
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bgRef.current) bgRef.current.volume = volume * 0.01;
  }, [volume]);

  useEffect(
    () => () => {
      bgRef.current?.pause();
    },
    [],
  );

  return useCallback(
    (key: SfxKey) => {
      if (volume === 0) return;
      const audio = new Audio(SFX[key]);
      audio.volume = volume * 0.1;
      void audio.play().catch(() => {});
    },
    [volume],
  );
}
