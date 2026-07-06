/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";

export function hoverCursor(enabled: boolean) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!enabled) return;
      e.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "default";
    },
  };
}

export interface PoiEntry {
  object: Group;
  distance: number;
}

export type PoiRegistry = Map<string, PoiEntry>;

interface PoiApi {
  activePoi: string | null;
  openPoi: (id: string) => void;
  registry: RefObject<PoiRegistry>;
}

export const PoiContext = createContext<PoiApi | null>(null);

export function usePoi(): PoiApi {
  const api = useContext(PoiContext);
  if (!api) throw new Error("usePoi outside PoiContext");
  return api;
}

interface PoiProps {
  id: string;
  distance: number;

  anchor?: RefObject<Group | null>;
  anchorPosition?: [number, number, number];
  anchorRotation?: [number, number, number];
  children: ReactNode;
}

export function Poi({
  id,
  distance,
  anchor,
  anchorPosition,
  anchorRotation,
  children,
}: PoiProps) {
  const api = usePoi();
  const ownAnchor = useRef<Group>(null);

  useEffect(() => {
    const object = anchor?.current ?? ownAnchor.current;
    const registry = api.registry.current;
    if (!object) return;
    registry.set(id, { object, distance });
    return () => {
      registry.delete(id);
    };
  }, [id, distance, anchor, api.registry]);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        if (api.activePoi !== id) api.openPoi(id);
      }}
      {...hoverCursor(api.activePoi !== id)}
    >
      {children}
      {!anchor && (
        <group
          ref={ownAnchor}
          position={anchorPosition}
          rotation={anchorRotation}
        />
      )}
    </group>
  );
}
