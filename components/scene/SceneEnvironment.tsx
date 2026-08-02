/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo } from "react";
import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { createEnvironmentTexture } from "./environment";
import { lightingForHour } from "./lighting";
import { useRoom } from "./RoomContext";

export default function SceneEnvironment() {
  const { hour } = useRoom();
  const intensity = useMemo(() => lightingForHour(hour).envIntensity, [hour]);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const map = useMemo(() => createEnvironmentTexture(gl), [gl]);

  useEffect(() => {
    invalidate();
  }, [map, intensity, invalidate]);

  return <Environment map={map} environmentIntensity={intensity} />;
}
