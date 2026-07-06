/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, type Camera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { PoiRegistry } from "./Poi";
import {
  CAMERA_LIMITS,
  MAX_FRAME_DELTA,
  OVERVIEW_POSITION,
  OVERVIEW_TARGET,
  ROOM_CLAMP,
} from "./constants";

interface CameraRigProps {
  activePoi: string | null;
  registry: RefObject<PoiRegistry>;
  reducedMotion: boolean;
  snapInitial: boolean;
  onRest: () => void;
}

const FLIGHT_DURATION = 1.1; // seconds

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const EXTRA_FRAMES = 4;

const MOVE_KEYS: Record<string, [right: number, forward: number]> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};
const MOVE_SPEED = 7;

const clampDir = new Vector3();
const moveForward = new Vector3();
const moveRight = new Vector3();
const moveStep = new Vector3();
const UP = new Vector3(0, 1, 0);

const TARGET_MARGIN = 0.3;

function stepLimit(pos: Vector3, step: Vector3, margin: number): number {
  let s = 1;
  if (Math.abs(step.x) > 1e-9) {
    const bound =
      step.x > 0 ? ROOM_CLAMP.maxX - margin : ROOM_CLAMP.minX + margin;
    s = Math.min(s, (bound - pos.x) / step.x);
  }
  if (Math.abs(step.z) > 1e-9) {
    const bound =
      step.z > 0 ? ROOM_CLAMP.maxZ - margin : ROOM_CLAMP.minZ + margin;
    s = Math.min(s, (bound - pos.z) / step.z);
  }
  return Math.max(0, Math.min(1, s));
}

function maxDistanceAlongRay(origin: Vector3, dir: Vector3): number {
  let tMax = Infinity;
  if (Math.abs(dir.x) > 1e-6) {
    const bound = dir.x > 0 ? ROOM_CLAMP.maxX : ROOM_CLAMP.minX;
    tMax = Math.min(tMax, (bound - origin.x) / dir.x);
  }
  if (Math.abs(dir.z) > 1e-6) {
    const bound = dir.z > 0 ? ROOM_CLAMP.maxZ : ROOM_CLAMP.minZ;
    tMax = Math.min(tMax, (bound - origin.z) / dir.z);
  }
  return tMax;
}

function constrainToRoom(camera: Camera, controls: OrbitControlsImpl) {
  clampDir.copy(camera.position).sub(controls.target);
  const dist = clampDir.length();
  if (dist < 1e-6) return;
  clampDir.divideScalar(dist);
  const tMax = maxDistanceAlongRay(controls.target, clampDir);
  controls.maxDistance = Math.min(CAMERA_LIMITS.maxDistance, tMax);
  controls.minDistance = Math.min(
    CAMERA_LIMITS.minDistance,
    controls.maxDistance,
  );
}

function flushControlMomentum(controls: OrbitControlsImpl) {
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = damping;
}

function applyKeyboardMove(
  camera: Camera,
  controls: OrbitControlsImpl,
  pressed: Set<string>,
  delta: number,
): boolean {
  moveStep.set(0, 0, 0);
  for (const code of pressed) {
    const dir = MOVE_KEYS[code];
    if (dir) moveStep.add(moveForward.set(dir[0], 0, dir[1]));
  }
  if (moveStep.lengthSq() < 1e-6) return false;
  const [dx, dz] = [moveStep.x, moveStep.z];

  moveForward.copy(controls.target).sub(camera.position);
  moveForward.y = 0;
  if (moveForward.lengthSq() < 1e-6) return false;
  moveForward.normalize();
  moveRight.crossVectors(moveForward, UP);

  moveStep
    .set(0, 0, 0)
    .addScaledVector(moveForward, dz)
    .addScaledVector(moveRight, dx)
    .normalize()
    .multiplyScalar(MOVE_SPEED * Math.min(delta, MAX_FRAME_DELTA));

  const scale = Math.min(
    stepLimit(camera.position, moveStep, 0),
    stepLimit(controls.target, moveStep, TARGET_MARGIN),
  );
  if (scale <= 0) return false;
  moveStep.multiplyScalar(scale);
  camera.position.add(moveStep);
  controls.target.add(moveStep);
  return true;
}

export default function CameraRig({
  activePoi,
  registry,
  reducedMotion,
  snapInitial,
  onRest,
}: CameraRigProps) {
  const lookAt = useRef(OVERVIEW_TARGET.clone());
  const startPos = useRef(new Vector3());
  const startLook = useRef(new Vector3());
  const targetPos = useRef(new Vector3());
  const targetLook = useRef(new Vector3());
  const normal = useRef(new Vector3());
  const pendingSnap = useRef(snapInitial);
  const driving = useRef(true);
  const flightStarted = useRef(false);
  const progress = useRef(0);
  const extraFrames = useRef(0);
  const pressed = useRef(new Set<string>());
  const { invalidate } = useThree();

  useEffect(() => {
    driving.current = true;
    flightStarted.current = false;
    progress.current = 0;
    extraFrames.current = EXTRA_FRAMES;
    invalidate();
  }, [activePoi, invalidate]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!(e.code in MOVE_KEYS)) return;
      e.preventDefault();
      pressed.current.add(e.code);
      invalidate();
    };
    const up = (e: KeyboardEvent) => pressed.current.delete(e.code);
    const clear = () => pressed.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [invalidate]);

  useFrame((state, delta) => {
    const { camera } = state;
    const controls = state.controls as OrbitControlsImpl | null;

    if (!driving.current) {
      if (controls) {
        const moved =
          controls.enabled &&
          applyKeyboardMove(camera, controls, pressed.current, delta);
        constrainToRoom(camera, controls);
        controls.update();
        if (moved) extraFrames.current = EXTRA_FRAMES;
      }
      camera.position.y = Math.max(camera.position.y, ROOM_CLAMP.minY);
      if (extraFrames.current > 0) {
        extraFrames.current--;
        invalidate();
      }
      return;
    }

    const poi = activePoi ? registry.current.get(activePoi) : undefined;
    if (activePoi && !poi) {
      invalidate();
      return;
    }
    if (poi) {
      poi.object.getWorldPosition(targetLook.current);
      poi.object.getWorldDirection(normal.current);
      targetPos.current
        .copy(targetLook.current)
        .addScaledVector(normal.current, poi.distance);
    } else {
      targetPos.current.copy(OVERVIEW_POSITION);
      targetLook.current.copy(OVERVIEW_TARGET);
    }

    if (!flightStarted.current) {
      startPos.current.copy(camera.position);
      camera.getWorldDirection(normal.current);
      startLook.current
        .copy(camera.position)
        .addScaledVector(
          normal.current,
          camera.position.distanceTo(targetLook.current),
        );
      flightStarted.current = true;
    }

    const snap = reducedMotion || pendingSnap.current;
    pendingSnap.current = false;
    progress.current = snap
      ? 1
      : Math.min(
          1,
          progress.current + Math.min(delta, MAX_FRAME_DELTA) / FLIGHT_DURATION,
        );
    const k = easeInOutCubic(progress.current);
    camera.position.lerpVectors(startPos.current, targetPos.current, k);
    lookAt.current.lerpVectors(startLook.current, targetLook.current, k);
    camera.lookAt(lookAt.current);

    if (progress.current < 1) {
      extraFrames.current = EXTRA_FRAMES;
      invalidate();
      return;
    }

    if (!activePoi) {
      if (controls) {
        controls.target.copy(OVERVIEW_TARGET);

        controls.minDistance = CAMERA_LIMITS.minDistance;
        controls.maxDistance = CAMERA_LIMITS.maxDistance;
        flushControlMomentum(controls);
        camera.position.copy(OVERVIEW_POSITION);
        camera.lookAt(OVERVIEW_TARGET);
      }
      driving.current = false;
      onRest();
    }
    if (extraFrames.current > 0) {
      extraFrames.current--;
      invalidate();
    }
  });

  return null;
}
