/* Copyright (c) 2026 eele14. All Rights Reserved. */
"use client";

import { useState, useSyncExternalStore } from "react";
import { Rnd } from "react-rnd";
import Glass, {
  useGlassSupport,
  type GlassMode,
  type GlassSettings,
} from "./Glass";
import RefractionLayer from "./RefractionLayer";
import Wallpaper from "./Wallpaper";

type GlassLook = GlassSettings & { mode: GlassMode };

interface Slider {
  key: keyof GlassSettings;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface ControlsProps {
  look: GlassLook;
  support: Record<GlassMode, boolean>;
  onMode: (mode: GlassMode) => void;
  onChange: (key: keyof GlassSettings, value: number) => void;
}

const DEFAULTS: GlassSettings = {
  blur: 0.5,
  refraction: 30,
  bezel: 24,
  tint: 0.06,
};
const PANEL_BLUR = 14;

const SLIDERS: Slider[] = [
  { key: "refraction", label: "Refraction", min: 0, max: 110, step: 1 },
  { key: "bezel", label: "Bezel", min: 4, max: 60, step: 1 },
  { key: "blur", label: "Blur", min: 0, max: 24, step: 0.5 },
  { key: "tint", label: "Tint", min: 0, max: 0.6, step: 0.02 },
];

const MODES: { mode: GlassMode; label: string; note: string }[] = [
  {
    mode: "backdrop",
    label: "Backdrop",
    note: "Svg displacement filter behind the glass, only rendered by chromium",
  },
  {
    mode: "webgl",
    label: "WebGL",
    note: "Glass runs on webgl shader, should work everywhere",
  },
  {
    mode: "blur",
    label: "Blur",
    note: "Classic glasmorphism effect, bad",
  },
];

const MENUS = ["Finder", "File", "Edit", "View", "Go", "Window", "Help"];

const SWATCHES = [
  "#ff5f57",
  "#febc2e",
  "#28c840",
  "#0a84ff",
  "#bf5af2",
  "#1a1a1a",
];

const DOCK = [
  {
    name: "Files",
    fill: "linear-gradient(#5ac8fa, #0a84ff)",
    glyph: (
      <path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    ),
  },
  {
    name: "Terminal",
    fill: "linear-gradient(#4a4a4f, #1c1c1e)",
    glyph: <path d="M6 8l4 4-4 4M12 16h6" />,
  },
  {
    name: "Browser",
    fill: "linear-gradient(#64d2ff, #0071e3)",
    glyph: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </>
    ),
  },
  {
    name: "Mail",
    fill: "linear-gradient(#6fb7ff, #1f6feb)",
    glyph: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3.5 7.5l8.5 6 8.5-6" />
      </>
    ),
  },
  {
    name: "Notes",
    fill: "linear-gradient(#ffe066, #ffb800)",
    glyph: <path d="M6 7h12M6 12h12M6 17h7" />,
  },
  {
    name: "Games",
    fill: "linear-gradient(#ff8a80, #ff375f)",
    glyph: (
      <>
        <rect x="5" y="5" width="6" height="6" rx="1" />
        <rect x="13" y="5" width="6" height="6" rx="1" />
        <rect x="5" y="13" width="6" height="6" rx="1" />
        <rect x="13" y="13" width="6" height="6" rx="1" />
      </>
    ),
  },
  {
    name: "Settings",
    fill: "linear-gradient(#aeaeb2, #636366)",
    glyph: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" strokeDasharray="3 3.3" />
      </>
    ),
  },
];

function subscribeClock(onTick: () => void) {
  const id = setInterval(onTick, 10_000);
  return () => clearInterval(id);
}

function readClock(): string {
  return new Date().toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MenuBar() {
  const clock = useSyncExternalStore(subscribeClock, readClock, () => "");

  return (
    <header className="glass-menubar">
      <strong>eele</strong>
      {MENUS.map((menu) => (
        <span key={menu}>{menu}</span>
      ))}
      <time>{clock}</time>
    </header>
  );
}

function DemoWindow() {
  return (
    <Rnd
      default={{ x: 56, y: 76, width: 520, height: 360 }}
      minWidth={320}
      minHeight={220}
      bounds="parent"
      dragHandleClassName="demo-titlebar"
      style={{ zIndex: 1 }}
    >
      <div className="demo-window">
        <div className="demo-titlebar">
          <span className="demo-traffic">
            <i />
            <i />
            <i />
          </span>
          Liquid Glass
        </div>
        <div className="demo-body">
          <h1>Liquid Glass in a browser</h1>
          <p>
            Drag the glass lens around this demo window, the rim bends the text
            and everything below, a displacement map derived from a convex
            glass, runs as svg filter.
          </p>
          <p>
            Chromium can run the filter on the glass itself, the others use
            WebGL as a workaround, drawn from a snapshot of whats beneath,
            refreshed when window changes.
          </p>
          <div className="demo-swatches">
            {SWATCHES.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
        </div>
      </div>
    </Rnd>
  );
}

function Dock({ look }: { look: GlassLook }) {
  return (
    <div className="glass-dock-rail">
      <Glass {...look} radius={30} className="glass-dock">
        {DOCK.map((icon) => (
          <span
            key={icon.name}
            className="glass-dock-icon"
            title={icon.name}
            style={{ background: icon.fill }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {icon.glyph}
            </svg>
          </span>
        ))}
      </Glass>
    </div>
  );
}

function Controls({ look, support, onMode, onChange }: ControlsProps) {
  return (
    <aside className="glass-panel-rail">
      <Glass {...look} blur={PANEL_BLUR} radius={24} className="glass-panel">
        <h2>Glass</h2>
        <div className="glass-segmented">
          {MODES.map(({ mode, label }) => (
            <button
              key={mode}
              aria-pressed={look.mode === mode}
              disabled={!support[mode]}
              onClick={() => onMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        {SLIDERS.map(({ key, label, ...range }) => (
          <label key={key}>
            <span>
              {label}
              <output>{look[key]}</output>
            </span>
            <input
              type="range"
              {...range}
              value={look[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
            />
          </label>
        ))}
        <p>{MODES.find(({ mode }) => mode === look.mode)?.note}</p>
        <p>
          The draggable lense and the dock can be adjusted with the sliders,
          this window stays fixed
        </p>
      </Glass>
    </aside>
  );
}

export default function GlassDemo() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [wanted, setWanted] = useState<GlassMode | null>(null);
  const support = useGlassSupport();
  const best = MODES.find(({ mode }) => support[mode])?.mode ?? "blur";
  const mode = wanted && support[wanted] ? wanted : best;
  const look: GlassLook = { ...settings, mode };

  return (
    <RefractionLayer
      className="glass-demo"
      backdrop={
        <>
          <Wallpaper />
          <MenuBar />
          <DemoWindow />
        </>
      }
    >
      <Rnd
        default={{ x: 430, y: 250, width: 300, height: 170 }}
        minWidth={120}
        minHeight={80}
        bounds="parent"
        style={{ zIndex: 2 }}
      >
        <Glass {...look} radius={44} className="glass-lens">
          <span>Drag and resize</span>
        </Glass>
      </Rnd>
      <Dock look={look} />
      <Controls
        look={look}
        support={support}
        onMode={setWanted}
        onChange={(key, value) => setSettings({ ...settings, [key]: value })}
      />
    </RefractionLayer>
  );
}
