/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Object3D,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { useRoom } from "./RoomContext";
import { skyColorForHour } from "./lighting";
import { MAX_FRAME_DELTA, ROOM_BOUNDS } from "./constants";

const { maxX, minZ, maxZ } = ROOM_BOUNDS;
const centerZ = (minZ + maxZ) / 2;

export const WINDOW_OPENING = {
  x: 3.0 - centerZ,
  y: 1.05,
  w: 0.85,
  h: 0.6,
};

const BACKDROP_X = maxX + 2.2;
const RAIN_GREY = new Color("#8b95a3");

const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const STAR_COUNT = 360;

function Stars({ darkness }: { darkness: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = BACKDROP_X - 0.15 - rand(i, 3) * 0.5;
      positions[i * 3 + 1] = 0.9 + rand(i, 1) ** 2 * 4.5;
      positions[i * 3 + 2] = -2 + rand(i, 2) * 11;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    return geo;
  }, []);

  return (
    <points geometry={geometry} visible={darkness > 0.03} frustumCulled={false}>
      <pointsMaterial
        color="#f3f1e4"
        size={0.16}
        transparent
        opacity={darkness * 0.9}
        sizeAttenuation
      />
    </points>
  );
}

const SHOT_SECONDS = 0.9;
const SHOT_GAP_S: [number, number] = [18, 58];

function ShootingStar({ dark, raining }: { dark: boolean; raining: boolean }) {
  const meshRef = useRef<Mesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const shot = useRef({ active: false, t: 0, z0: 0, dir: 1 });
  const clear = useRef({ dark, raining });

  useEffect(() => {
    clear.current = { dark, raining };
  }, [dark, raining]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay =
        SHOT_GAP_S[0] + Math.random() * (SHOT_GAP_S[1] - SHOT_GAP_S[0]);
      timer = setTimeout(() => {
        if (
          clear.current.dark &&
          !clear.current.raining &&
          !shot.current.active
        ) {
          shot.current = {
            active: true,
            t: 0,
            z0: 1.6 + Math.random() * 2.6,
            dir: Math.random() < 0.5 ? 1 : -1,
          };
          invalidate();
        }
        schedule();
      }, delay * 1000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [invalidate]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const s = shot.current;
    if (!mesh || !s.active) return;
    s.t += Math.min(delta, MAX_FRAME_DELTA) / SHOT_SECONDS;
    const k = Math.min(1, s.t);
    mesh.visible = true;

    mesh.position.set(4.35, 1.5 - k * 0.4, s.z0 + s.dir * k * 1.1);
    mesh.rotation.set(0, -Math.PI / 2, Math.atan2(-0.4, 1.1 * s.dir));
    (mesh.material as MeshBasicMaterial).opacity = Math.sin(Math.PI * k) * 0.85;
    if (k >= 1) {
      s.active = false;
      mesh.visible = false;
    }
    invalidate();
  });

  return (
    <mesh ref={meshRef} visible={false} frustumCulled={false}>
      <planeGeometry args={[0.22, 0.008]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

const RAIN_COUNT = 96;
const RAIN_TOP = 2.4;
const rainStreak = new Object3D();

function OutsideRain({ darkness }: { darkness: number }) {
  const meshRef = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const drops = useMemo(
    () =>
      Array.from({ length: RAIN_COUNT }, (_, i) => {
        const depth = i % 3; // 0 = near the glass, 2 = near the backdrop
        return {
          x: maxX + 0.15 + depth * 0.75 + rand(i, 5) * 0.4,
          z: 1.2 + rand(i, 6) * 3.6,
          speed: 2.2 - depth * 0.45 + rand(i, 7) * 0.4,
          phase: rand(i, 8),
          scale: 1 - depth * 0.28,
        };
      }),
    [],
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    drops.forEach((drop, i) => {
      const y = RAIN_TOP * (1 - ((t * drop.speed * 0.42 + drop.phase) % 1));
      rainStreak.position.set(drop.x, y, drop.z);
      rainStreak.rotation.set(0, -Math.PI / 2, 0); // face the room
      rainStreak.scale.setScalar(drop.scale);
      rainStreak.updateMatrix();
      mesh.setMatrixAt(i, rainStreak.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    invalidate();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, RAIN_COUNT]}
      frustumCulled={false}
    >
      <planeGeometry args={[0.007, 0.11]} />
      <meshBasicMaterial
        color="#e8f0f5"
        transparent
        opacity={0.55 * (0.35 + 0.65 * (1 - darkness))}
      />
    </instancedMesh>
  );
}

export default function Outside({ hour }: { hour: number }) {
  const { raining } = useRoom();
  const sky = useMemo(() => {
    const color = skyColorForHour(hour);
    if (!raining) return color;
    const lum = (color.r + color.g + color.b) / 3;
    const grey = RAIN_GREY.clone().multiplyScalar(Math.max(0.3, lum * 2.2));
    return color.lerp(grey, 0.55);
  }, [hour, raining]);
  const darkness = Math.min(
    1,
    Math.max(0, (0.42 - (sky.r + sky.g + sky.b) / 3) / 0.25),
  );

  return (
    <group>
      <mesh position={[BACKDROP_X, 4, 3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[36, 16]} />
        <meshBasicMaterial color={sky} />
      </mesh>
      {!raining && <Stars darkness={darkness} />}
      <ShootingStar dark={darkness > 0.5} raining={raining} />
      {raining && <OutsideRain darkness={darkness} />}
    </group>
  );
}
