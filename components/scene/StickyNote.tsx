/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useMemo } from "react";
import { Poi } from "./Poi";
import { useRoom } from "./RoomContext";
import { createCanvasTexture } from "./textures";

function drawNote(ctx: CanvasRenderingContext2D, found: number, total: number) {
  ctx.fillStyle = "#f2c94c";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 236, 256, 20);
  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "center";
  ctx.font = "44px 'Courier New', monospace";
  ctx.fillText("secrets", 128, 92);
  ctx.font = "bold 72px 'Courier New', monospace";
  ctx.fillText(`${found}/${total}`, 128, 178);
}

export default function StickyNote() {
  const { eggsFound, eggsTotal } = useRoom();
  const texture = useMemo(
    () =>
      createCanvasTexture(256, 256, (ctx) =>
        drawNote(ctx, eggsFound, eggsTotal),
      ),
    [eggsFound, eggsTotal],
  );
  return (
    <Poi
      id="secrets"
      distance={1}
      anchorPosition={[0.62, 0.72, 3.38]}
      anchorRotation={[0, Math.PI, 0]}
    >
      <mesh position={[0.62, 0.72, 3.385]} rotation={[0, Math.PI, 0.06]}>
        <planeGeometry args={[0.11, 0.11]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </Poi>
  );
}
