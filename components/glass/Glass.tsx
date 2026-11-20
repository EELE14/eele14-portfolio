/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { hasWebGL2 } from "@/components/scene/webgl";
import { displacementImage, imageDataUrl } from "./displacement";
import { useRefraction } from "./RefractionLayer";

export interface GlassSettings {
  blur: number;
  refraction: number;
  bezel: number;
  tint: number;
}

// backdrop bends everything beneath the glass but only renders in Chromium;
// webgl lets the RefractionLayer redraw the rim and works everywhere.
export type GlassMode = "backdrop" | "webgl" | "blur";

interface GlassProps extends GlassSettings {
  radius: number;
  mode: GlassMode;
  className?: string;
  children?: React.ReactNode;
}

interface Size {
  width: number;
  height: number;
}

interface LensFilterProps {
  id: string;
  map: string;
  size: Size;
  blur: number;
  refraction: number;
}

const SATURATION = 1.6;
const noSubscription = () => () => {};

// Only Chromium renders an SVG filter as a backdrop-filter, other engines
// accept the value and then draw no backdrop effect at all
function isChromium(): boolean {
  return /Chrome\//.test(navigator.userAgent);
}

export function useGlassSupport(): Record<GlassMode, boolean> {
  const backdrop = useSyncExternalStore(
    noSubscription,
    isChromium,
    () => false,
  );
  const webgl = useSyncExternalStore(noSubscription, hasWebGL2, () => false);
  return { backdrop, webgl, blur: true };
}

function useElementSize(ref: React.RefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: el.offsetWidth, height: el.offsetHeight }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

function LensFilter({ id, map, size, blur, refraction }: LensFilterProps) {
  return (
    <svg className="glass-defs" aria-hidden="true">
      <filter
        id={id}
        x={0}
        y={0}
        width={size.width}
        height={size.height}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="soft" />
        <feImage
          href={map}
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          result="lens"
        />
        <feDisplacementMap
          in="soft"
          in2="lens"
          scale={refraction * 2}
          xChannelSelector="R"
          yChannelSelector="G"
          result="bent"
        />
        <feColorMatrix in="bent" type="saturate" values={String(SATURATION)} />
      </filter>
    </svg>
  );
}

export default function Glass({
  blur,
  refraction,
  bezel,
  tint,
  radius,
  mode,
  className = "",
  children,
}: GlassProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const filterId = `glass-${useId().replace(/\W/g, "")}`;
  const register = useRefraction();
  const image = useMemo(
    () =>
      mode !== "blur" && size
        ? displacementImage({ ...size, radius, bezel })
        : null,
    [mode, size, radius, bezel],
  );
  const map = useMemo(
    () => (mode === "backdrop" && image ? imageDataUrl(image) : null),
    [mode, image],
  );
  const backdropFilter = map
    ? `url(#${filterId})`
    : `blur(${blur}px) saturate(${SATURATION})`;

  useEffect(() => {
    const element = ref.current;
    if (mode !== "webgl" || !image || !element || !register) return;
    return register({ id: filterId, element, map: image, refraction });
  }, [mode, image, refraction, register, filterId]);

  return (
    <div
      ref={ref}
      className={`glass ${className}`}
      style={{
        borderRadius: radius,
        background: `rgba(255, 255, 255, ${tint})`,
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
      }}
    >
      {map && size && (
        <LensFilter
          id={filterId}
          map={map}
          size={size}
          blur={blur}
          refraction={refraction}
        />
      )}
      {children}
    </div>
  );
}
