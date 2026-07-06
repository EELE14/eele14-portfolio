/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { CanvasTexture, Mesh, MeshBasicMaterial } from "three";
import KenneyModel from "../KenneyModel";
import { hoverCursor, Poi, usePoi } from "../Poi";
import { useRoom } from "../RoomContext";
import { createCanvasTexture } from "../textures";
import { sfxTvZap } from "../sfx";
import { MAX_FRAME_DELTA } from "../constants";
import {
  drawPong,
  freshPong,
  PONG_KEYS,
  stepPong,
  type PongState,
} from "./pong";
import {
  drawNoise,
  drawOff,
  drawTestCard,
  drawVisualizer,
  INSET,
  paintScreen,
  PICTURE,
} from "./screen";

const SCREEN_PLANE = {
  width: 0.245,
  height: 0.213,
  center: [0.1535, 0.134, -0.008] as [number, number, number],
};
const NOISE_SECONDS = 0.25;

const CHANNELS = ["off", "test", "visualizer", "pong"] as const;
type Channel = (typeof CHANNELS)[number];

export default function Television() {
  const { activePoi } = usePoi();
  const { hour, musicOn, unlockEgg } = useRoom();
  const invalidate = useThree((state) => state.invalidate);
  const [manual, setManual] = useState<Channel>("off");
  const screenRef = useRef<Mesh>(null);
  const pong = useRef<PongState>(freshPong());
  const pressed = useRef(new Set<string>());
  const noiseLeft = useRef(0);
  const dirty = useRef(true);

  // the radio switches the set to the visualizer on its own
  const channel: Channel = manual === "off" && musicOn ? "visualizer" : manual;
  const playing = activePoi === "tv" && channel === "pong";

  const texture = useMemo(
    () => createCanvasTexture(PICTURE.W + INSET * 2, PICTURE.H + INSET * 2),
    [],
  );

  useEffect(() => {
    dirty.current = true;
    invalidate();
  }, [channel, hour, musicOn, invalidate]);

  useEffect(() => {
    if (!playing) return;
    const down = (e: KeyboardEvent) => {
      if (!PONG_KEYS.has(e.code)) return;
      pressed.current.add(e.code);
      invalidate();
    };
    const up = (e: KeyboardEvent) => pressed.current.delete(e.code);
    const keys = pressed.current;
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.clear();
    };
  }, [playing, invalidate]);

  const zap = () => {
    const next = CHANNELS[(CHANNELS.indexOf(manual) + 1) % CHANNELS.length];
    if (next === "pong") pong.current = freshPong();
    sfxTvZap();
    setManual(next);
    noiseLeft.current = NOISE_SECONDS;
    unlockEgg("tv-zapper");
    invalidate();
  };

  useFrame((state, delta) => {
    const mesh = screenRef.current;
    if (!mesh) return;
    const tex = (mesh.material as MeshBasicMaterial).map as CanvasTexture;
    const ctx = (tex.image as HTMLCanvasElement).getContext("2d")!;
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    const t = state.clock.elapsedTime;

    if (noiseLeft.current > 0) {
      noiseLeft.current -= dt;
      paintScreen(ctx, drawNoise);
      dirty.current = true;
    } else if (playing) {
      stepPong(pong.current, pressed.current, dt);
      paintScreen(ctx, (c) => drawPong(c, pong.current, true));
    } else if (channel === "visualizer" && musicOn) {
      paintScreen(ctx, (c) => drawVisualizer(c, t, true));
    } else if (dirty.current) {
      if (channel === "off") paintScreen(ctx, drawOff);
      else if (channel === "test")
        paintScreen(ctx, (c) => drawTestCard(c, hour));
      else if (channel === "visualizer")
        paintScreen(ctx, (c) => drawVisualizer(c, 0, false));
      else paintScreen(ctx, (c) => drawPong(c, pong.current, false));
      dirty.current = false;
    } else {
      return;
    }
    tex.needsUpdate = true;
    invalidate();
  });

  return (
    <Poi
      id="tv"
      distance={2.2}
      anchorPosition={[-1.19, 0.45, 0.6]}
      anchorRotation={[0, Math.PI / 2, 0]}
    >
      <group
        position={[-1.21, 0.31, 0.805]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(e) => {
          if (activePoi !== "tv") return;
          e.stopPropagation();
          zap();
        }}
        {...hoverCursor(activePoi === "tv")}
      >
        <KenneyModel model="televisionVintage" />
        <mesh ref={screenRef} position={SCREEN_PLANE.center}>
          <planeGeometry args={[SCREEN_PLANE.width, SCREEN_PLANE.height]} />
          <meshBasicMaterial map={texture} />
        </mesh>
      </group>
    </Poi>
  );
}
