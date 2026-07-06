/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { PointLight } from "three";
import { lightingForHour } from "./lighting";
import { useRoom } from "./RoomContext";

export default function Lights() {
  const { hour, lampGlow, musicOn } = useRoom();
  const s = useMemo(() => lightingForHour(hour), [hour]);
  const invalidate = useThree((state) => state.invalidate);
  const lampRef = useRef<PointLight>(null);

  const shadowsDirty = useRef(true);

  useEffect(() => {
    shadowsDirty.current = true;
    invalidate();
  }, [s, invalidate]);

  useEffect(() => {
    invalidate();
  }, [lampGlow, invalidate]);

  useFrame((state) => {
    if (shadowsDirty.current) {
      state.gl.shadowMap.needsUpdate = true;
      shadowsDirty.current = false;
    }
    const lamp = lampRef.current;
    if (!lamp || !musicOn) return;
    lamp.intensity =
      lampGlow *
      3 *
      (1 + 0.07 * Math.sin(state.clock.elapsedTime * Math.PI * 2 * 2.2));
    invalidate();
  });

  return (
    <>
      <ambientLight color={s.ambientColor} intensity={s.ambientIntensity} />
      <directionalLight
        position={s.sunPosition}
        color={s.sunColor}
        intensity={s.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-normalBias={0.05}
      />
      <pointLight
        ref={lampRef}
        position={[1.3, 2.9, -1.15]}
        intensity={lampGlow * 3}
        color="#ffd9a0"
        distance={10}
        decay={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.3}
        shadow-camera-far={12}
        shadow-normalBias={0.05}
      />
    </>
  );
}
