/* Copyright (c) 2026 eele14. All Rights Reserved. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getLocalIconUrl } from "@/lib/client/skill-icons";

const ANIMATIONS = ["float-a", "float-b", "float-c", "float-d"] as const;
const JITTER = 90;
const MIN_GAP = 24;

interface IconSpec {
  id: number;
  src: string;
  x: number;
  y: number;
  size: number;
  anim: string;
  duration: number;
  delay: number;
}

interface Props {
  screensaver?: boolean;
  onDismiss?: () => void;
}

function makePrng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function halton(index: number, base: number): number {
  let result = 0,
    f = 1,
    i = index + 1;
  while (i > 0) {
    f /= base;
    result += f * (i % base);
    i = Math.floor(i / base);
  }
  return result;
}

function overlaps(
  ax: number,
  ay: number,
  aw: number,
  bx: number,
  by: number,
  bw: number,
): boolean {
  return (
    ax < bx + bw + MIN_GAP &&
    ax + aw + MIN_GAP > bx &&
    ay < by + bw + MIN_GAP &&
    ay + aw + MIN_GAP > by
  );
}

export default function FloatingIcons({
  screensaver = false,
  onDismiss,
}: Props) {
  const [icons, setIcons] = useState<IconSpec[]>([]);
  const onDismissRef = useRef(onDismiss);
  useLayoutEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data: Array<{ icon?: string | null }>) => {
        const srcs = [
          ...new Set(
            data
              .map((s) => (s.icon ? getLocalIconUrl(s.icon) : null))
              .filter((v): v is string => Boolean(v)),
          ),
        ];
        if (!srcs.length) return;

        const rand = makePrng(0xdeadbeef);
        const W = window.innerWidth;
        const H = window.innerHeight - 40;
        const placed: IconSpec[] = [];

        srcs.forEach((src, i) => {
          const size = Math.floor(rand() * 24 + 52);
          const maxX = W - size;
          const maxY = H - size;
          const baseX = halton(i, 2) * maxX;
          const baseY = halton(i, 3) * maxY;
          const jx = (rand() - 0.5) * JITTER;
          const jy = (rand() - 0.5) * JITTER;
          const px = Math.max(0, Math.min(maxX, baseX + jx));
          const py = Math.max(0, Math.min(maxY, baseY + jy));

          if (placed.some((p) => overlaps(px, py, size, p.x, p.y, p.size)))
            return;

          placed.push({
            id: i,
            src,
            x: px,
            y: py,
            size,
            anim: ANIMATIONS[Math.floor(rand() * ANIMATIONS.length)],
            duration: rand() * 28 + 26,
            delay: -(rand() * 20),
          });
        });

        setIcons(placed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!screensaver) return;
    const dismiss = () => onDismissRef.current?.();
    window.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", dismiss);
    return () => {
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [screensaver]);

  if (!icons.length) return null;

  const opacity = screensaver ? 0.08 : 0.02;
  const speedMult = screensaver ? 4 : 1;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {icons.map((icon) => (
        <img
          key={icon.id}
          src={icon.src}
          alt=""
          width={icon.size}
          height={icon.size}
          style={{
            position: "absolute",
            left: icon.x,
            top: icon.y,
            opacity,
            filter: "grayscale(1)",
            animation: `${icon.anim} ${icon.duration / speedMult}s ${icon.delay / speedMult}s ease-in-out infinite`,
            userSelect: "none",
            transition: "opacity 1.2s ease",
          }}
        />
      ))}
    </div>
  );
}
