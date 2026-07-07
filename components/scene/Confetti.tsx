/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, DoubleSide, Object3D, type InstancedMesh } from "three";
import { MAX_FRAME_DELTA } from "./constants";

const COUNT = 90;
const COLORS = ["#e8472a", "#f2c94c", "#27ae8f", "#f5f0e8", "#7de8c3"];
const GRAVITY = 1.4;

const scratch = new Object3D();

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  phase: number;
  life: number;
  age: number;
}

export default function Confetti({
  burst,
  origin,
}: {
  burst: number;
  origin: [number, number, number];
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const particles = useRef<Particle[] | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  const colors = useMemo(
    () =>
      Array.from(
        { length: COUNT },
        (_, i) => new Color(COLORS[i % COLORS.length]),
      ),
    [],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    scratch.position.set(0, -1, 0);
    scratch.scale.setScalar(0);
    scratch.updateMatrix();
    for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, scratch.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  // the origin lives in a ref so the spawn effect depends ONLY on `burst`:
  // an inline-array prop would re-trigger it on every parent re-render and
  // freeze the confetti at age 0 (e.g. 60×/s during the clock time-lapse)
  const originRef = useRef(origin);
  useEffect(() => {
    originRef.current = origin;
  }, [origin]);

  useEffect(() => {
    if (!burst) return;
    const mesh = meshRef.current;
    if (!mesh) return;
    const [ox, oy, oz] = originRef.current;

    particles.current = Array.from({ length: COUNT }, () => ({
      x: ox + (Math.random() - 0.5) * 0.22,
      y: oy + (Math.random() - 0.5) * 0.08,
      z: oz,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.3 + Math.random() * 0.4,
      vz: -(0.02 + Math.random() * 0.1),
      spin: 4 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
      life: 3.2 + Math.random() * 1.4,
      age: 0,
    }));
    colors.forEach((color, i) => mesh.setColorAt(i, color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    invalidate();
  }, [burst, colors, invalidate]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const parts = particles.current;
    if (!mesh || !parts) return;
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    let alive = 0;

    parts.forEach((p, i) => {
      p.age += dt;
      const grounded = p.y <= 0.012;
      if (!grounded) {
        p.vy = Math.max(p.vy - GRAVITY * dt, -0.35);
        p.vx *= 0.995;
        p.vz *= 0.995;
        p.x += (p.vx + Math.sin(p.age * 6 + p.phase) * 0.25) * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        if (p.y < 0.012) p.y = 0.012;
      }
      const fade = Math.min(1, Math.max(0, (p.life - p.age) / 0.5));
      if (fade > 0) alive++;
      scratch.position.set(p.x, p.y, p.z);
      if (grounded) scratch.rotation.set(-Math.PI / 2, 0, p.phase);
      else
        scratch.rotation.set(
          p.age * p.spin + p.phase,
          p.phase,
          p.age * p.spin * 0.6,
        );
      scratch.scale.setScalar(fade);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (!alive) particles.current = null;
    invalidate();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <planeGeometry args={[0.02, 0.032]} />
      <meshStandardMaterial side={DoubleSide} roughness={1} />
    </instancedMesh>
  );
}
