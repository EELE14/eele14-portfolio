/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import type { Group } from "three";
import CameraRig from "./CameraRig";
import Lights from "./Lights";
import Workspace from "./Workspace";
import PaperOverlay from "./PaperOverlay";
import { PoiContext, type PoiRegistry } from "./Poi";
import { RoomContext } from "./RoomContext";
import { useRoomState } from "./useRoomState";
import { preloadSfx, sfxClockSpin } from "./sfx";
import { easeInOutCubic } from "./easing";
import { currentLocalHour, formatHour } from "./lighting";
import {
  CAMERA_FOV,
  CAMERA_LIMITS,
  OVERVIEW_POSITION,
  OVERVIEW_TARGET,
} from "./constants";

const POI_KEY = "eele14-desk-poi";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const TIME_LAPSE_SECONDS = 20;

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="scene-loading scene-loading-overlay">
      LOADING WORKSPACE… {Math.round(progress)}%
    </div>
  );
}

export default function Scene() {
  const [activePoi, setActivePoi] = useState<string | null>(
    () => sessionStorage.getItem(POI_KEY) || null,
  );
  const [initialPoi] = useState(activePoi);
  const [hour, setHour] = useState(currentLocalHour);
  const [debug] = useState(() =>
    new URLSearchParams(window.location.search).has("debug"),
  );
  const reducedMotion = useReducedMotion();
  const screenAnchor = useRef<Group>(null);
  const registry = useRef<PoiRegistry>(new Map());

  const [orbitEnabled, setOrbitEnabled] = useState(false);
  const lapsing = useRef(false);

  const startTimeLapse = useCallback(() => {
    if (lapsing.current) return;
    lapsing.current = true;
    sfxClockSpin(TIME_LAPSE_SECONDS);
    const startHour = hour;
    const startTime = performance.now();
    const step = () => {
      const t = Math.min(
        1,
        (performance.now() - startTime) / (TIME_LAPSE_SECONDS * 1000),
      );
      setHour((startHour + 24 * easeInOutCubic(t)) % 24);
      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }
      lapsing.current = false;
      setHour(debug ? startHour : currentLocalHour());
    };
    requestAnimationFrame(step);
  }, [hour, debug]);

  const { roomApi, paper, closePaper } = useRoomState(hour, startTimeLapse);

  useEffect(() => {
    preloadSfx();
  }, []);

  useEffect(() => {
    if (debug) return;
    const timer = setInterval(() => {
      if (!lapsing.current) setHour(currentLocalHour());
    }, 30_000);
    return () => clearInterval(timer);
  }, [debug]);

  const setPoiPersistent = useCallback((id: string | null) => {
    setActivePoi(id);
    setOrbitEnabled(false);
    sessionStorage.setItem(POI_KEY, id ?? "");
  }, []);

  const poiApi = useMemo(
    () => ({ activePoi, openPoi: setPoiPersistent, registry }),
    [activePoi, setPoiPersistent],
  );

  useEffect(() => {
    if (!activePoi && !paper) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (paper) closePaper();
      else setPoiPersistent(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activePoi, paper, closePaper, setPoiPersistent]);

  return (
    <>
      <Canvas
        frameloop="demand"
        shadows
        onCreated={({ gl }) => {
          gl.shadowMap.autoUpdate = false;
        }}
        gl={{ powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        style={{ pointerEvents: activePoi === "laptop" ? "none" : "auto" }}
        camera={{
          fov: CAMERA_FOV,
          near: 0.1,
          far: 100,
          position: OVERVIEW_POSITION.toArray(),
        }}
      >
        <PoiContext.Provider value={poiApi}>
          <RoomContext.Provider value={roomApi}>
            <Lights />
            <Suspense fallback={null}>
              <Workspace screenAnchor={screenAnchor} />
            </Suspense>
          </RoomContext.Provider>
          <OrbitControls
            makeDefault
            enabled={orbitEnabled}
            enablePan={false}
            target={OVERVIEW_TARGET}
            minDistance={CAMERA_LIMITS.minDistance}
            maxDistance={CAMERA_LIMITS.maxDistance}
            minPolarAngle={CAMERA_LIMITS.minPolarAngle}
            maxPolarAngle={CAMERA_LIMITS.maxPolarAngle}
          />
          <CameraRig
            activePoi={activePoi}
            registry={registry}
            reducedMotion={reducedMotion}
            snapInitial={!!initialPoi}
            onRest={() => setOrbitEnabled(true)}
          />
        </PoiContext.Provider>
      </Canvas>

      <LoadingOverlay />

      {paper && <PaperOverlay key={paper} side={paper} onClose={closePaper} />}

      {activePoi ? (
        <button
          type="button"
          className="scene-back-btn"
          onClick={() => setPoiPersistent(null)}
        >
          &larr; BACK
        </button>
      ) : (
        <div className="scene-hint">CLICK OBJECTS TO TAKE A LOOK</div>
      )}

      {debug && (
        <label className="scene-time-slider">
          TIME {formatHour(hour)}
          <input
            type="range"
            min={0}
            max={24}
            step={0.25}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
          />
        </label>
      )}
    </>
  );
}
