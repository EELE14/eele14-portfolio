/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import type { Group, Object3D } from "three";
import KenneyModel from "./KenneyModel";
import { hoverCursor, Poi, usePoi } from "./Poi";
import { useRoom, type PaperSide } from "./RoomContext";
import { createCanvasTexture } from "./textures";
import { sfxDrawer } from "./sfx";
import { easeInOutQuad } from "./easing";
import { MAX_FRAME_DELTA } from "./constants";

const DRAWER_BASE_Z = -0.164;
const OPEN_DISTANCE = 0.13;
const OPEN_SECONDS = 0.45;
const DRAWER_NAMES: Record<PaperSide, string> = {
  left: "drawerLeft",
  right: "drawerRight",
};

function drawPaper(ctx: CanvasRenderingContext2D, side: PaperSide) {
  ctx.fillStyle = "#f7f3ea";
  ctx.fillRect(0, 0, 192, 256);

  const seed = side === "left" ? 0.7 : 2.3;
  ctx.strokeStyle = "rgba(40, 40, 60, 0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(28, 36);
  ctx.lineTo(28 + 70 + Math.sin(seed) * 20, 36);
  ctx.stroke();

  ctx.strokeStyle = "rgba(40, 40, 60, 0.35)";
  ctx.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    const y = 68 + row * 22;
    const length = 120 + Math.sin(seed + row * 1.7) * 35;
    ctx.beginPath();
    ctx.moveTo(24, y);
    for (let x = 24; x <= 24 + length; x += 6) {
      ctx.lineTo(x, y + Math.sin(seed + x * 0.9 + row) * 2.2);
    }
    ctx.stroke();
  }
}

function Paper({ side, parent }: { side: PaperSide; parent: Object3D }) {
  const { activePoi } = usePoi();
  const { openPaper } = useRoom();
  const texture = useMemo(
    () => createCanvasTexture(192, 256, (ctx) => drawPaper(ctx, side)),
    [side],
  );
  return createPortal(
    <mesh
      position={[0.11, 0.025, 0.04]}
      rotation={[-Math.PI / 2, 0, side === "left" ? 0.12 : -0.08]}
      onClick={(e) => {
        if (activePoi !== "drawers") return;
        e.stopPropagation();
        openPaper(side);
      }}
      {...hoverCursor(activePoi === "drawers")}
    >
      <planeGeometry args={[0.13, 0.17]} />
      <meshStandardMaterial map={texture} />
    </mesh>,
    parent,
  );
}

export default function Nightstand() {
  const { activePoi } = usePoi();
  const modelRef = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const progress = useRef(0);

  const [nodes, setNodes] = useState<Record<PaperSide, Object3D> | null>(null);

  useEffect(() => {
    const root = modelRef.current;
    if (!root) return;
    const frame = requestAnimationFrame(() => {
      const left = root.getObjectByName(DRAWER_NAMES.left);
      const right = root.getObjectByName(DRAWER_NAMES.right);
      if (left && right) setNodes({ left, right });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const open = activePoi === "drawers";
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) sfxDrawer(open);
    mounted.current = true;
    invalidate();
  }, [open, invalidate]);

  useFrame((_, delta) => {
    const target = open ? 1 : 0;
    if (Math.abs(progress.current - target) < 1e-3) return;
    const root = modelRef.current;
    if (!root) return;
    progress.current +=
      Math.sign(target - progress.current) *
      (Math.min(delta, MAX_FRAME_DELTA) / OPEN_SECONDS);
    progress.current = Math.min(1, Math.max(0, progress.current));
    const z = DRAWER_BASE_Z + easeInOutQuad(progress.current) * OPEN_DISTANCE;
    for (const name of Object.values(DRAWER_NAMES)) {
      const drawer = root.getObjectByName(name);
      if (drawer) drawer.position.z = z;
    }
    invalidate();
  });

  return (
    <Poi
      id="drawers"
      distance={1.5}
      anchorPosition={[2.15, 0.4, 2.26]}
      anchorRotation={[-1.375, -0.524, 0]}
    >
      <group ref={modelRef}>
        <KenneyModel
          model="sideTableDrawers"
          position={[2.29, 0, 2.0]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </group>
      {nodes && <Paper side="left" parent={nodes.left} />}
      {nodes && <Paper side="right" parent={nodes.right} />}
    </Poi>
  );
}
