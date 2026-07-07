/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  Vector3,
} from "three";
import KenneyModel from "./KenneyModel";
import { hoverCursor } from "./Poi";
import { useRoom } from "./RoomContext";
import { sfxBinIn, sfxBounce, sfxRim, sfxToss } from "./sfx";
import { easeInOutQuad } from "./easing";
import { MAX_FRAME_DELTA } from "./constants";

const START: [number, number, number] = [0.38, 0.62, 0.48];
const MOUTH = { x: 0.55, y: 0.364, z: 0.02, inner: 0.06, outer: 0.08 };
const BALL_R = 0.03;
const GRAVITY = 4.2;
const SIM_DT = 1 / 120;
const MAX_FRAMES = 480; // 4 s safety cap
const STREAK_FOR_EGG = 3;

const LID_SEAM_RAW_Y = 0.72;
const LID_MAX_RAW_X = 0.2;
const LID_OPEN_ANGLE = -1.5;
const LID_SECONDS = 0.3;

type SoundKind = "rim" | "in" | "bounce" | "thud";

interface ThrowAnim {
  pos: number[]; // xyz per frame
  spin: number[]; // accumulated rotation angle per frame
  events: { frame: number; kind: SoundKind }[];
  frames: number;
  made: boolean;
}

function simulateThrow(): ThrowAnim {
  const roll = Math.random();
  const outcome = roll < 0.4 ? "swish" : roll < 0.7 ? "rim-in" : "rim-out";

  const sx = START[0] + (Math.random() - 0.5) * 0.03;
  const sy = START[1] + (Math.random() - 0.5) * 0.02;
  const sz = START[2] + (Math.random() - 0.5) * 0.03;
  // horizontal throw direction, used to pick near/far rim contact points
  const dir = new Vector3(MOUTH.x - sx, 0, MOUTH.z - sz).normalize();

  let tx = MOUTH.x + (Math.random() - 0.5) * 0.02;
  let ty = MOUTH.y - 0.01;
  let tz = MOUTH.z + (Math.random() - 0.5) * 0.02;
  if (outcome === "rim-in") {
    tx = MOUTH.x - dir.x * 0.065;
    tz = MOUTH.z - dir.z * 0.065;
    ty = MOUTH.y + 0.008;
  } else if (outcome === "rim-out") {
    tx = MOUTH.x + dir.x * MOUTH.outer;
    tz = MOUTH.z + dir.z * MOUTH.outer;
    ty = MOUTH.y + 0.004;
  }

  const T = 0.72 + Math.random() * 0.08;
  let x = sx;
  let y = sy;
  let z = sz;
  let vx = (tx - sx) / T;
  let vz = (tz - sz) / T;
  let vy = (ty - sy + 0.5 * GRAVITY * T * T) / T;

  const pos: number[] = [];
  const spin: number[] = [];
  const events: ThrowAnim["events"] = [];
  let spinSpeed = 9 + Math.random() * 4;
  let angle = 0;
  let contactDone = false;
  let inside = false;
  let resting = 0;
  let bounces = 0;

  for (let frame = 0; frame < MAX_FRAMES; frame++) {
    const t = frame * SIM_DT;

    if (t >= T && !contactDone) {
      contactDone = true;
      if (outcome === "swish") {
        vx *= 0.15;
        vz *= 0.15;
        inside = true;
        events.push({ frame, kind: "in" });
      } else if (outcome === "rim-in") {
        events.push({ frame, kind: "rim" });
        const toCenter = new Vector3(MOUTH.x - x, 0, MOUTH.z - z).normalize();
        vx = toCenter.x * 0.28;
        vz = toCenter.z * 0.28;
        vy = 0.85;
        spinSpeed *= 0.6;
      } else {
        events.push({ frame, kind: "rim" });
        vx *= 0.55;
        vz *= 0.55;
        vy = 0.4;
        spinSpeed *= 0.7;
      }
    }

    vy -= GRAVITY * SIM_DT;
    x += vx * SIM_DT;
    y += vy * SIM_DT;
    z += vz * SIM_DT;

    if (contactDone && !inside && outcome === "rim-in" && vy < 0) {
      const dist = Math.hypot(x - MOUTH.x, z - MOUTH.z);
      if (y < MOUTH.y + BALL_R && dist < MOUTH.inner) {
        inside = true;
        vx *= 0.2;
        vz *= 0.2;
        events.push({ frame, kind: "in" });
      }
    }

    if (inside && y < MOUTH.y - 0.22) {
      y = MOUTH.y - 0.22;
      if (vy !== 0) events.push({ frame, kind: "thud" });
      vx = vy = vz = 0;
      spinSpeed = 0;
      resting++;
    }

    if (!inside && contactDone && y < BALL_R) {
      y = BALL_R;
      if (Math.abs(vy) > 0.12) {
        vy = -vy * 0.48;
        vx *= 0.72;
        vz *= 0.72;
        bounces++;
        if (bounces <= 3) events.push({ frame, kind: "bounce" });
      } else {
        vy = 0;
        vx *= 0.94;
        vz *= 0.94;
        spinSpeed = Math.hypot(vx, vz) / BALL_R;
        if (Math.hypot(vx, vz) < 0.02) resting++;
      }
    }

    angle += spinSpeed * SIM_DT;
    pos.push(x, y, z);
    spin.push(angle);
    if (resting > 45) break;
  }

  return {
    pos,
    spin,
    events,
    frames: spin.length,
    made: outcome !== "rim-out",
  };
}

function splitLid(root: Group): Group | null {
  // the glTF scene is cached and shared, so a remount finds it already split
  const existing = root.getObjectByName("lidPivot");
  if (existing) return existing as Group;
  let pivot: Group | null = null;
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    if (!Array.isArray(obj.material)) obj.material.side = DoubleSide;
    if (pivot || obj.userData.lidSplit) return;

    if (!Array.isArray(obj.material) && obj.material.name !== "metalDark")
      return;
    const geometry = obj.geometry as BufferGeometry;
    const index = geometry.index;
    if (!index) return;
    const pos = geometry.attributes.position;
    const lid: number[] = [];
    const body: number[] = [];
    for (let i = 0; i < index.count; i += 3) {
      const [a, b, c] = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      const centerY = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
      const maxX = Math.max(pos.getX(a), pos.getX(b), pos.getX(c));
      const isLid = centerY >= LID_SEAM_RAW_Y && maxX <= LID_MAX_RAW_X;
      (isLid ? lid : body).push(a, b, c);
    }
    if (!lid.length || !body.length) return;

    obj.userData.lidSplit = true;
    geometry.setIndex(new BufferAttribute(new Uint16Array(body), 1));

    const lidGeometry = new BufferGeometry();
    for (const name of Object.keys(geometry.attributes))
      lidGeometry.setAttribute(name, geometry.attributes[name]);
    lidGeometry.setIndex(new BufferAttribute(new Uint16Array(lid), 1));

    // hinge at the back rim (-z edge at the seam height)
    let hingeZ = Infinity;
    for (const i of lid) hingeZ = Math.min(hingeZ, pos.getZ(i));
    const lidMesh = new Mesh(lidGeometry, obj.material);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidMesh.position.set(0, -LID_SEAM_RAW_Y, -hingeZ);
    pivot = new Group();
    pivot.name = "lidPivot";
    pivot.position.set(0, LID_SEAM_RAW_Y, hingeZ);
    pivot.add(lidMesh);
    obj.add(pivot);
  });
  return pivot;
}

export default function PaperToss() {
  const { unlockEgg } = useRoom();
  const invalidate = useThree((state) => state.invalidate);
  const ballRef = useRef<Mesh>(null);
  const modelRef = useRef<Group>(null);
  const lidPivot = useRef<Group | null>(null);
  const lidProgress = useRef(0);
  const anim = useRef<ThrowAnim | null>(null);
  const elapsed = useRef(0);
  const fired = useRef(0);
  const streak = useRef(0);
  const spinAxis = useMemo(() => new Vector3(1, 0.3, 1.2).normalize(), []);

  useEffect(() => {
    if (modelRef.current) lidPivot.current = splitLid(modelRef.current);
  }, []);

  const throwBall = () => {
    if (anim.current) return;
    anim.current = simulateThrow();
    elapsed.current = 0;
    fired.current = 0;
    sfxToss();
    sfxRim(); // lid clank as it flips open
    invalidate();
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DELTA);

    // the lid flips open for the throw and falls shut afterwards
    const lid = lidPivot.current;
    if (lid) {
      const target = anim.current ? 1 : 0;
      if (lidProgress.current !== target) {
        const before = lidProgress.current;
        lidProgress.current = Math.min(
          1,
          Math.max(0, before + (target ? dt : -dt) / LID_SECONDS),
        );
        lid.rotation.x = LID_OPEN_ANGLE * easeInOutQuad(lidProgress.current);
        state.gl.shadowMap.needsUpdate = true;
        if (before > 0 && lidProgress.current === 0) sfxBounce(0.7);
        invalidate();
      }
    }

    const ball = ballRef.current;
    const current = anim.current;
    if (!ball || !current) return;

    state.gl.shadowMap.needsUpdate = true;
    elapsed.current += dt;
    const frame = Math.min(current.frames - 1, elapsed.current / SIM_DT);
    const i = Math.floor(frame);
    const k = frame - i;
    const j = Math.min(i + 1, current.frames - 1);
    ball.visible = true;
    ball.position.set(
      current.pos[i * 3] * (1 - k) + current.pos[j * 3] * k,
      current.pos[i * 3 + 1] * (1 - k) + current.pos[j * 3 + 1] * k,
      current.pos[i * 3 + 2] * (1 - k) + current.pos[j * 3 + 2] * k,
    );
    ball.setRotationFromAxisAngle(
      spinAxis,
      current.spin[i] * (1 - k) + current.spin[j] * k,
    );

    while (
      fired.current < current.events.length &&
      current.events[fired.current].frame <= frame
    ) {
      const kind = current.events[fired.current].kind;
      if (kind === "rim") sfxRim();
      else if (kind === "in") sfxBinIn();
      else if (kind === "thud") sfxBounce(0.5);
      else sfxBounce(1);
      fired.current++;
    }

    if (frame >= current.frames - 1) {
      ball.visible = false;
      streak.current = current.made ? streak.current + 1 : 0;
      if (streak.current >= STREAK_FOR_EGG) unlockEgg("trickshot");
      anim.current = null;
    }
    invalidate();
  });

  return (
    <group>
      <group
        onClick={(e) => {
          e.stopPropagation();
          throwBall();
        }}
        {...hoverCursor(true)}
      >
        <group ref={modelRef}>
          <KenneyModel
            model="trashcan"
            position={[0.55, 0, 0.02]}
            scale={0.85}
          />
        </group>
      </group>
      <mesh ref={ballRef} visible={false} castShadow scale={[1, 0.92, 1.06]}>
        <icosahedronGeometry args={[BALL_R, 0]} />
        <meshStandardMaterial color="#f1ece0" flatShading />
      </mesh>
    </group>
  );
}
