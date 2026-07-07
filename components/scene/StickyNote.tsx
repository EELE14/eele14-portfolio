/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useMemo, useState } from "react";
import Confetti from "./Confetti";
import { Poi, hoverCursor } from "./Poi";
import { useRoom } from "./RoomContext";
import { createCanvasTexture } from "./textures";

const CONFETTI_ORIGIN: [number, number, number] = [0.62, 0.72, 3.34];

function drawNote(
  ctx: CanvasRenderingContext2D,
  found: number,
  total: number,
  complete: boolean,
) {
  ctx.fillStyle = "#f2c94c";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 236, 256, 20);
  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "center";
  ctx.font = "44px 'Courier New', monospace";
  ctx.fillText("secrets", 128, 80);
  ctx.font = "bold 72px 'Courier New', monospace";
  ctx.fillText(`${found}/${total}`, 128, 160);
  if (complete) {
    ctx.fillStyle = "#c0392b";
    ctx.font = "bold 32px 'Courier New', monospace";
    ctx.fillText("→ click me!", 128, 215);
  }
}

export default function StickyNote() {
  const { eggsFound, eggsTotal, celebrating, toggleParty } = useRoom();
  const [burst, setBurst] = useState(0);
  const complete = eggsFound === eggsTotal;
  const texture = useMemo(
    () =>
      createCanvasTexture(256, 256, (ctx) =>
        drawNote(ctx, eggsFound, eggsTotal, complete),
      ),
    [eggsFound, eggsTotal, complete],
  );

  const party = () => {
    if (!celebrating) setBurst((b) => b + 1);
    toggleParty();
  };

  return (
    <>
      <Poi
        id="secrets"
        distance={1}
        anchorPosition={[0.62, 0.72, 3.38]}
        anchorRotation={[0, Math.PI, 0]}
      >
        <mesh
          position={[0.62, 0.72, 3.385]}
          rotation={[0, Math.PI, 0.06]}
          onClick={(e) => {
            if (!complete) return;
            e.stopPropagation();
            party();
          }}
          {...hoverCursor(complete)}
        >
          <planeGeometry args={[0.11, 0.11]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      </Poi>
      <Confetti burst={burst} origin={CONFETTI_ORIGIN} />
    </>
  );
}
