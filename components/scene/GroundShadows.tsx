/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { memo } from "react";
import { ContactShadows } from "@react-three/drei";
import { ROOM_CENTER, ROOM_SIZE } from "./constants";

const OVERHANG = 0.4;

function GroundShadows() {
  return (
    <ContactShadows
      position={[ROOM_CENTER.x, 0.014, ROOM_CENTER.z]}
      scale={[ROOM_SIZE.width + OVERHANG, ROOM_SIZE.depth + OVERHANG]}
      far={0.6}
      blur={2.4}
      opacity={0.62}
      resolution={1024}
      color="#3d2c1d"
      frames={1}
    />
  );
}

export default memo(GroundShadows);
