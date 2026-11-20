/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { trackLayers, type LayerTracker } from "./layerTracker";
import { grown, relativeRect } from "./rect";
import { createSceneRenderer, type SceneFrame } from "./sceneRenderer";

export interface Lens {
  id: string;
  element: HTMLElement;
  map: ImageData;
  refraction: number;
}

interface RefractionLayerProps {
  backdrop: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

type Register = (lens: Lens) => () => void;
type ElementRef<T> = React.RefObject<T | null>;

const MAX_RATIO = 2;

const RefractionContext = createContext<Register | null>(null);

export function useRefraction(): Register | null {
  return useContext(RefractionContext);
}

function sceneFrame(
  root: HTMLElement,
  tracker: LayerTracker,
  lenses: Lens[],
): SceneFrame {
  const origin = root.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
  const placed = lenses.map((lens) => ({
    key: lens.id,
    map: lens.map,
    refraction: lens.refraction,
    rect: relativeRect(lens.element, origin),
  }));
  const covered = placed.map(({ rect, refraction }) => grown(rect, refraction));
  return {
    width: origin.width,
    height: origin.height,
    ratio,
    lenses: placed,
    layers: placed.length ? tracker.layers(covered, ratio) : [],
  };
}

function useSceneLoop(
  layer: ElementRef<HTMLDivElement>,
  canvas: ElementRef<HTMLCanvasElement>,
  lenses: Lens[],
) {
  const latest = useRef(lenses);

  useEffect(() => {
    latest.current = lenses;
  });

  useEffect(() => {
    const root = layer.current;
    const target = canvas.current;
    if (!root || !target) return;
    const renderer = createSceneRenderer(target);
    if (!renderer) return;
    const tracker = trackLayers(root);
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      renderer.draw(sceneFrame(root, tracker, latest.current));
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      tracker.dispose();
      renderer.dispose();
    };
  }, [layer, canvas]);
}

export default function RefractionLayer({
  backdrop,
  className,
  children,
}: RefractionLayerProps) {
  const layer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [lenses, setLenses] = useState<Lens[]>([]);

  const register = useCallback<Register>((lens) => {
    setLenses((all) => [...all, lens]);
    return () => setLenses((all) => all.filter((other) => other !== lens));
  }, []);

  useSceneLoop(layer, canvas, lenses);

  return (
    <RefractionContext.Provider value={register}>
      <div className={className}>
        <div ref={layer} className="refraction-layer">
          {backdrop}
        </div>
        <canvas ref={canvas} className="refraction-canvas" aria-hidden="true" />
        {children}
      </div>
    </RefractionContext.Provider>
  );
}
