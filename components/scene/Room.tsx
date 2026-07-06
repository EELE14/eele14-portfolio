/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useMemo } from "react";
import { ROOM_BOUNDS } from "./constants";
import { skyColorForHour } from "./lighting";

const WALL_HEIGHT = 2.4;
const SKIRTING = { height: 0.06, depth: 0.018 };

const COLORS = {
  floor: "#c3b394",
  backFront: "#e8dfcc",
  sides: "#ded4bf",
  skirting: "#a89a80",
  frame: "#1a1a1a",
};

const { minX, maxX, minZ, maxZ } = ROOM_BOUNDS;
const width = maxX - minX;
const depth = maxZ - minZ;
const centerX = (minX + maxX) / 2;
const centerZ = (minZ + maxZ) / 2;

const WALLS: Array<{
  position: [number, number, number];
  rotationY: number;
  length: number;
  color: string;
}> = [
  {
    position: [centerX, 0, minZ],
    rotationY: 0,
    length: width,
    color: COLORS.backFront,
  },
  {
    position: [centerX, 0, maxZ],
    rotationY: Math.PI,
    length: width,
    color: COLORS.backFront,
  },
  {
    position: [minX, 0, centerZ],
    rotationY: Math.PI / 2,
    length: depth,
    color: COLORS.sides,
  },
  {
    position: [maxX, 0, centerZ],
    rotationY: -Math.PI / 2,
    length: depth,
    color: COLORS.sides,
  },
];

function Poster({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[size[0] + 0.04, size[1] + 0.04, 0.012]} />
        <meshStandardMaterial color={COLORS.frame} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Window({ hour }: { hour: number }) {
  const sky = useMemo(() => skyColorForHour(hour), [hour]);
  const W = 0.85;
  const H = 0.6;
  const FRAME = 0.06;
  return (
    <group position={[maxX - 0.015, 1.05, 3.0]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[W + FRAME, H + FRAME, 0.02]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color={sky} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <boxGeometry args={[0.03, H, 0.006]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <boxGeometry args={[W, 0.03, 0.006]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>
    </group>
  );
}

function WallClock({ hour }: { hour: number }) {
  const hourAngle = -((hour % 12) / 12) * Math.PI * 2;
  const minuteAngle = -((hour % 1) * Math.PI * 2);
  return (
    <group position={[-0.075, 1.08, minZ + 0.035]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.025, 24]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.015, 24]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i * Math.PI) / 2) * 0.095,
            Math.cos((i * Math.PI) / 2) * 0.095,
            0.015,
          ]}
        >
          <boxGeometry args={[0.015, 0.025, 0.006]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      <group rotation={[0, 0, hourAngle]}>
        <mesh position={[0, 0.03, 0.018]}>
          <boxGeometry args={[0.014, 0.06, 0.006]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
      <group rotation={[0, 0, minuteAngle]}>
        <mesh position={[0, 0.045, 0.024]}>
          <boxGeometry args={[0.009, 0.09, 0.005]} />
          <meshStandardMaterial color="#e8472a" />
        </mesh>
      </group>
    </group>
  );
}

export default function Room({ hour }: { hour: number }) {
  return (
    <group>
      <mesh
        position={[centerX, -0.005, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width + 0.2, depth + 0.2]} />
        <meshStandardMaterial color={COLORS.floor} />
      </mesh>

      {WALLS.map((wall, i) => (
        <group
          key={i}
          position={wall.position}
          rotation={[0, wall.rotationY, 0]}
        >
          <mesh position={[0, WALL_HEIGHT / 2, 0]} receiveShadow>
            <planeGeometry args={[wall.length, WALL_HEIGHT]} />
            <meshStandardMaterial color={wall.color} />
          </mesh>
          <mesh
            position={[0, SKIRTING.height / 2, SKIRTING.depth / 2]}
            receiveShadow
          >
            <boxGeometry
              args={[wall.length, SKIRTING.height, SKIRTING.depth]}
            />
            <meshStandardMaterial color={COLORS.skirting} />
          </mesh>
        </group>
      ))}

      <Poster
        position={[-0.55, 0.98, minZ + 0.02]}
        size={[0.34, 0.44]}
        color="#e8472a"
      />
      <Poster
        position={[0.4, 1.05, minZ + 0.02]}
        size={[0.3, 0.24]}
        color="#27ae8f"
      />

      <Window hour={hour} />
      <WallClock hour={hour} />
    </group>
  );
}
