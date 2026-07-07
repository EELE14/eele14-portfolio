/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { PointLight } from "three";
import { lightingForHour } from "./lighting";
import { useRoom } from "./RoomContext";

export default function Lights() {
  const { hour, lampGlow, musicOn, celebrating } = useRoom();
  const s = useMemo(() => lightingForHour(hour), [hour]);
  const invalidate = useThree((state) => state.invalidate);
  const lampRef = useRef<PointLight>(null);
  const discoRef = useRef<PointLight>(null);

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
    const t = state.clock.elapsedTime;

    const disco = discoRef.current;
    if (disco) {
      if (celebrating) {
        disco.color.setHSL((t * 0.22) % 1, 0.85, 0.55);
        const base = 7 + 4 * s.sunIntensity;
        disco.intensity =
          base * (0.65 + 0.35 * Math.sin(t * Math.PI * 2 * 0.91));
        state.gl.shadowMap.needsUpdate = true;
        invalidate();
      } else if (disco.intensity !== 0) {
        disco.intensity = 0;
        shadowsDirty.current = true;
        invalidate();
      }
    }

    const lamp = lampRef.current;
    if (!lamp || !musicOn) return;
    lamp.intensity =
      lampGlow * 3 * (1 + 0.07 * Math.sin(t * Math.PI * 2 * 2.2));
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
      <pointLight
        ref={discoRef}
        position={[2.5, 11, 7.5]}
        intensity={0}
        distance={22}
        decay={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-normalBias={0.05}
      />
    </>
  );
}
