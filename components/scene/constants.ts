/* Copyright (c) 2026 eele14. All Rights Reserved. */
import { Vector3 } from "three";

const SCREEN_LOCAL_CENTER = new Vector3(0.132, 0.0875, -0.1948);
const SCREEN_LOCAL_WIDTH = 0.2285;
const SCREEN_ASPECT = 1.794;
export const SCREEN_TILT = -0.421;

export const SCREEN_PX = {
  width: 1280,
  height: Math.round(1280 / SCREEN_ASPECT),
};

export const HTML_SCALE = SCREEN_LOCAL_WIDTH / SCREEN_PX.width;

export const LAPTOP_SCALE = 1.4;

export const SCREEN_ANCHOR_POSITION = SCREEN_LOCAL_CENTER.clone().add(
  new Vector3(0, 0.408, 0.913).multiplyScalar(0.003),
);

export const SCENE_SCALE = 5;

export const CAMERA_FOV = 45;
export const OVERVIEW_POSITION = new Vector3(1.6, 1.1, 1.95).multiplyScalar(
  SCENE_SCALE,
);
export const OVERVIEW_TARGET = new Vector3(-0.12, 0.3, -0.05).multiplyScalar(
  SCENE_SCALE,
);

export const ZOOM_DISTANCE = 0.25 * SCENE_SCALE;

export const ROOM_BOUNDS = { minX: -1.5, maxX: 2.5, minZ: -0.48, maxZ: 3.52 };

export const ROOM_SIZE = {
  width: ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX,
  depth: ROOM_BOUNDS.maxZ - ROOM_BOUNDS.minZ,
};

export const ROOM_CENTER = {
  x: (ROOM_BOUNDS.minX + ROOM_BOUNDS.maxX) / 2,
  z: (ROOM_BOUNDS.minZ + ROOM_BOUNDS.maxZ) / 2,
};

export const CAMERA_LIMITS = {
  minDistance: 1.4 * SCENE_SCALE,

  maxDistance: 2.8 * SCENE_SCALE,
  minPolarAngle: 0.7,
  maxPolarAngle: 1.32,
};

export const MAX_FRAME_DELTA = 0.05; // seconds

const WALL_MARGIN = 0.04;
export const ROOM_CLAMP = {
  minX: (ROOM_BOUNDS.minX + WALL_MARGIN) * SCENE_SCALE,
  maxX: (ROOM_BOUNDS.maxX - WALL_MARGIN) * SCENE_SCALE,
  minZ: (ROOM_BOUNDS.minZ + WALL_MARGIN) * SCENE_SCALE,
  maxZ: (ROOM_BOUNDS.maxZ - WALL_MARGIN) * SCENE_SCALE,
  minY: 0.12 * SCENE_SCALE,
};
